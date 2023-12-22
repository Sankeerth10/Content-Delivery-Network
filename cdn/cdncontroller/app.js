"use strict";

let express = require("express");
let mongoose = require("mongoose");
let bodyParser = require("body-parser");
let cors = require("cors");
let cookieParser = require("cookie-parser");
let path = require("path");
let fs = require("fs");
let util = require("util");
const http2 = require("spdy");
const cron = require("node-cron");
const fse = require("fs-extra");
const rimraf = require("rimraf");

global.edgeServerLocGlobal = [];


let config = require("./config/config");
let routes = require("./routes/cdn.route");
let controller = require("./controller/cdn.controller");
let edgeServerModel = require("./model/edgeServer.model");
let utilHelper = require("./util");
let dbUrl = "mongodb://127.0.0.1/" + config.db;
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
let edgeServerLoc;

let accessLogStream = fs.createWriteStream(
  path.join(__dirname, "console.log"),
  { flags: "a" }
);
let logStdout = process.stdout;
console.log = function (d) {
  accessLogStream.write(util.format(d) + "\n");
  logStdout.write(util.format(d) + "\n");
};

let app = express();

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ extended: true, limit: "50mb" }));

app.get(
  "/delete-everything",
  (req, res, next) => {
    fs.writeFileSync(path.join(__dirname, "console.log"), "");
    next();
  },
  async (req, res, next) => {
    let buckets = await edgeServerModel.find({})
    req.locals = {};
    req.locals.edgeServerLoc = buckets;
    next();
  },
  controller.delete,
  utilHelper.deleteFiles,
  (req, res) => {
    edgeServerModel.deleteMany({}, (err, data) => {
      if(err)
        console.log(`Error occurred while deleting all configured servers ${err}`);
      else 
        console.log(`Deleted all the configured servers`);
    });
    res.status(200).jsonp({message: 'Deleted all the cached data successfully', status: 'success'});
  }
);

app.get('/edgeservers', (req, res) => {
  edgeServerModel.find({}, (err, data) => {
    if(data){
      res.send(data)
    }
    else {
      res.send(null);
    }
  });
});

app.post('/create-edge-server',
  (req, res, next) => {
    const folder = path.join("../edgeservers/", req.body.bucket);
    fs.mkdirSync(folder, { recursive: true });
    next();
  },
  controller.createEdge
);

app.delete('/delete-edge-server/:edgeId', 
  controller.getEdge,
  (req, res, next) => {
    const folder = path.join("../edgeservers/", req.locals.dEdge.bucket);
    if(fs.existsSync(folder)){
      rimraf.sync(folder);
    }
    next();
  },
  controller.deleteEdge
);


app.get("/logs", (req, res) => {
  let read = fs.createReadStream(path.join(__dirname, "console.log"));
  read.pipe(res);
});

const regex = /(images|js|css|videos)(.*)$/g;

cron.schedule("*/10 * * * * *", async () => {
  let buckets = await edgeServerModel.find({})
  const directoryPath = '../edgeservers/'; 
  for(let i=0; i<buckets.length - 1; i++) {
    let allFile_I = getAllFiles(directoryPath + buckets[i].bucket);
    allFile_I = allFile_I.map((e) => {return e.match(regex)[0]});
    for(let j=i+1; j<buckets.length; j++){
      let allFiles_J = getAllFiles(directoryPath + buckets[j].bucket);
      allFiles_J = allFiles_J.map((e) => {return e.match(regex)[0]});
      allFile_I = allFiles_J = syncFiles(allFile_I, allFiles_J, buckets[i].bucket, buckets[j].bucket) 
    }
  }
});

http2
  .createServer(
    {
      key: fs.readFileSync("./server.key"),
      cert: fs.readFileSync("./server.crt"),
    },
    app
  )
  .listen(3001, (err) => {
    if (err) {
      throw new Error(err);
    }
    edgeServerModel.find({}, (err, data) => {
      if(!data || data?.length < 3){
        edgeServerModel.deleteMany({}, async (err, edata) => {
          if(err)
            console.log(`Error occurred while deleting all configured servers ${err}`);
          else 
            console.log(`Deleted all the configured servers`);
            edgeServerLoc = await edgeServerModel.create(config.edgeServerLoc);
            console.log(`New Edge servers created`);
            createEdgeServers(edgeServerLoc);
        });    
      }
      else {
        edgeServerLoc = data;
        createEdgeServers(data);
      }  
    })
    console.log("Controller listening on port 3001");
  });

async function createEdgeServers(buckets) {
  global.edgeServerLocGlobal = buckets;
  for(let b of buckets) {
    const folder = path.join("../edgeservers/", b.bucket);
    fs.mkdirSync(folder, { recursive: true });
  }

  app.use(
    "/",
    async (req, res, next) => {
      req.locals = {};
      if(edgeServerLoc){
        req.locals.edgeServerLoc = edgeServerLoc;
      }
      next();
    },
    routes
  );
  
}


function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function syncFiles(allFiles_I, allFiles_J, I, J) {
  let I_J = allFiles_I.filter(x => !allFiles_J.includes(x));
  let J_I = allFiles_J.filter(x => !allFiles_I.includes(x));
  let src;
  let dest;
  for(let p of I_J) {
    src = path.join('../edgeservers/' + I, p);
    dest = path.join('../edgeservers/' + J, p);
    fse.copy(src, dest ,function (err) {
      if (err) return console.error(err)
    });
  }
  for(let p of J_I) {
    src = path.join('../edgeservers/' + J, p);
    dest = path.join('../edgeservers/' + I, p);
    fse.copy(src, dest ,function (err) {
      if (err) return console.error(err)
    });
  }
  return Array.from(new Set([...allFiles_I, ...allFiles_J]));
}

module.exports = edgeServerLoc;