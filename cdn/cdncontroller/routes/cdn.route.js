'use strict'

let express = require('express');
let router = express.Router();
let config = require('../config/config');
let cdnController = require('../controller/cdn.controller');
let edgeServerLoc = global.edgeServerLocGlobal;
let reqCounter = 0;
let reqPerServerCount;
let start = 1;
let end;
let defaultEdge = 0;
let maxRequest = 21;

router.route('/:filePath/:fileName')
.get(
    (req, res, next) => {
        edgeServerLoc = req.locals.edgeServerLoc;
        reqPerServerCount = Math.floor( maxRequest / edgeServerLoc.length);
        if(reqCounter > maxRequest){
            reqCounter = 0;
        }
        if(reqCounter === 0){
            start = 1;
            end = reqPerServerCount;
            defaultEdge = 0;
        }
        reqCounter++;
        start++;
        if(start === end) {
            defaultEdge++;
            if(defaultEdge ===  (edgeServerLoc.length - 2) && end < maxRequest){
                end = maxRequest;
            }
            else {
                end = end + reqPerServerCount;
            }
        }
        req.locals.nearestEdge = edgeServerLoc[defaultEdge];

        console.log(`reqCounter ${reqCounter}`)
        console.log(`reqPerServerCount ${reqPerServerCount}`)
        console.log(`defaultEdge count${defaultEdge} ${edgeServerLoc[defaultEdge]}`)
        console.log(`start ${start}`);
        console.log(`end ${end}`);
        next();
    },
    cdnController.checkContent,
    cdnController.getFile
);

module.exports = router;

