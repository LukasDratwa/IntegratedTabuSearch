var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');
var mongoose = require('mongoose');
var csv = require('csvtojson');
var config = require('../config.json');

router.get('/dataupload', function(req, res, next) {
    res.render('dataupload', { title: 'Upload data' });
});

router.post('/uploadRoadef', function(req, res, next) {
    var form = new formidable.IncomingForm();
    var jsonData = {
        optimizationObjectives: [],
        paintBatchLimit: [],
        ratios: [],
        vehicles: []
    };

    form.parse(req, function (err, fields, files) {
        // Vehicles
        csv({
            noheader: false,
            delimiter: ";"
        })
            .fromFile(files.vehicles.path)
            .on('json', (jsonObj) => {
                jsonData.vehicles.push(jsonObj)
            })
            .on('done', (error) => {

                // Ratios
                csv({
                    noheader: false,
                    delimiter: ";"
                })
                    .fromFile(files.ratios.path)
                    .on('json', (jsonObj) => {
                        jsonData.ratios.push(jsonObj)
                    })
                    .on('done', (error) => {

                        // PaintBatchLimitation
                        csv({
                            noheader: false,
                            delimiter: ";"
                        })
                            .fromFile(files.paintBatchLimit.path)
                            .on('json', (jsonObj) => {
                                jsonData.paintBatchLimit.push(jsonObj)
                            })
                            .on('done', (error) => {

                                // OptimizationObjectives
                                csv({
                                    noheader: false,
                                    delimiter: ";"
                                })
                                    .fromFile(files.optimizationObjectives.path)
                                    .on('json', (jsonObj) => {
                                        jsonData.optimizationObjectives.push(jsonObj)
                                    })
                                    .on('done', (error) => {
                                        res.send(jsonData);
                                        res.end();
                                    });
                            });
                    });
            });
    });
});

module.exports = router;