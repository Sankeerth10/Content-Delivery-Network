'use strict'

let devConfig = {
    db: 'contentdb',
    websiteURL: 'https://localhost:3002',
    edgeServerLoc: [
        {zone: 'New Delhi', la: 28.64, lo: 77.21, url: '../edgeservers/', bucket: 'e1-server', deletable: false},
        {zone: 'Berlin', la: 52.52, lo: 13.40, url: '../edgeservers/', bucket: 'e2-server', deletable: false},
        {zone: 'Montreal', la: 45.50, lo: -73.56, url: '../edgeservers/', bucket: 'e3-server', deletable: false}
    ]
}

module.exports = devConfig;