'use strict'

let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    la: Number,
    lo: Number,
    zone: String,
    url: String,
    bucket: String,
    createdAt: {type: Date, default: new Date()},
    updatedAt: Date,
    deletable: {type: Boolean, default: true}
});

let edgeServer = mongoose.model('edgeServers', schema);

module.exports = edgeServer;