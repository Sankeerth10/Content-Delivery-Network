'use strict'
let cdnModel = require('../model/cdn.model');
let edgeServerModel = require('../model/edgeServer.model');
let util = require('../util');
let config = require('../config/config');
const fs = require('fs');
let path = require('path');

let getFileData = (nearestEdge, fileName) => {
    return new Promise(async (resolve, reject) => {
        let fileData = await cdnModel.findOne({zone: nearestEdge.zone, fileName: fileName});
        if(fileData){
            resolve(fileData);
        }
        else{
            resolve(null);
        }
    });
}

exports.checkContent = async (req, res, next) => {
    let fileName = req.url;
    fileName = fileName.slice(1);
    console.log(`Content of file ${fileName}`);
    let nearestEdge = req.locals.nearestEdge;
    console.log(`Round Robin algorithm selected Edge Server ${nearestEdge.zone}`);
    let fileData = await getFileData(nearestEdge, fileName);
    if(fileData){
        if(!fileData.deleted){
            console.log('File is available');
            req.locals.fileData = fileData;
            next();
        }
        else{
            console.log('File is not available');
            let uploadFile = await util.storeFile(fileName, nearestEdge.bucket);
            if(uploadFile){
                let fileData = await cdnModel.findOneAndUpdate({zone: nearestEdge.zone, fileName: fileName}, {deleted: false, updatedAt: new Date()}, {upsert: true, new: true});
                req.locals.fileData = fileData;
                next();
            }   
            else{
                res.status(500).jsonp({status: false, message: 'Internal Server Error'});
            }    
        }
    }
    else{
        let uploadFile = await util.storeFile(fileName, nearestEdge.bucket);
        if(uploadFile){
            let fileData = await cdnModel.create({website: config.websiteURL, zone: nearestEdge.zone, url: nearestEdge.url, fileName: fileName});
            req.locals.fileData = fileData;
            next();    
        }
        else{
            res.status(400).jsonp({status: false, message: 'Bad Request'});
        }    
    }
}

exports.getFile = (req, res) => {
    console.log(`${req.locals.fileData.fileName} is served from ${req.locals.fileData.zone} edge server successfully`);
    let fileName = req.locals.fileData.fileName;
    let contentType = util.typeCheck(fileName)
    console.log(`fileName ${fileName}`)
    console.log(`contentType ${contentType}`)
    let url = req.locals.fileData.url;
    res.setHeader("Content-Type", contentType);
    res.headers = {"Content-Type": contentType}
    let nearestEdge = req.locals.nearestEdge;
    setTimeout(() => {
        const bucket = nearestEdge.bucket;
        const fileExt = fileName.split('/')[0];
        const serverDir = url + bucket + '/' + fileExt;
        const filePath = path.join(serverDir, fileName.split('/')[1]);
        const rs = fs.createReadStream(filePath);
        rs.pipe(res); 
    }, 2000);
}


exports.delete = (req, res, next) => {
    cdnModel.deleteMany({}, (err, data) => {
        if(err){
            console.log(`Error occurred while deleting all the cached data ${err}`);
            res.status(500).jsonp({message: 'Error occurred while deleting all the cached data', status: 'fail'});
        }
        else{
            console.log('Deleted all the cached data successfully');
            next();
        }
    });
}

exports.createEdge = async (req, res) => {
    const edge = await edgeServerModel.create(req.body);
    global.edgeServerLocGlobal.push(edge);
    res.status(200).jsonp({message: "edge server created successfully", status: 'pass', data: edge});
}

exports.deleteEdge = async (req, res) => {
    const edge = await edgeServerModel.deleteOne({_id: req.params.edgeId});
    res.status(200).jsonp({message: "edge server deleted successfully", status: 'pass', data: edge});
}

exports.getEdge = async (req, res, next) => {
    const edge = await edgeServerModel.findById(req.params.edgeId);
    req.locals = {};
    req.locals.dEdge = edge;
    next();
} 