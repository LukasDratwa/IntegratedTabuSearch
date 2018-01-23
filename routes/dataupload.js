/**
 * @author Lukas Dratwa
 *
 * Created on 22.11.2017.
 */
var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');
var csv = require('csvtojson');
var config = require('../config.json');

var mongoose = require('mongoose');
var DataSet = mongoose.model("DataSet");
var Vehicle = mongoose.model("Vehicle");
var Ratio = mongoose.model("Ratio");

router.get('/dataupload', function(req, res, next) {
    // console.log(req.query);
    res.render('dataupload', { title: 'Upload data' });
});

function finishUpload(dataSet, res) {
    console.log("Saved DataSet with " + dataSet.ratios.length + " ratios and " + dataSet.vehicles.length + " vehicles.");
    res.redirect("/dataupload?success=true&dataSetId=" + dataSet["_id"]);
}

function saveCars(res, jsonData, dataSet, savedRatios) {
    var counterVehicles = jsonData.vehicles.length;
    var savedVehciles = [];

    for(var x in jsonData.vehicles) {
        (function(x) {
            var vehicleRaw = jsonData.vehicles[x];

            var activatedFeatureRefs = [];
            var fields = Object.keys(vehicleRaw);
            for(var f=4; f<fields.length; f++) {
                if(vehicleRaw[fields[f]] == 1) {
                    activatedFeatureRefs.push(fields[f]);
                }
            }

            Ratio.find({
                "ident": {
                    $in: activatedFeatureRefs
                },
                "dataSetRef": dataSet["_id"]
            }, function(err, docs) {
                var vehicleData = {
                    dateString: vehicleRaw.Date,
                    seqRank: parseInt(vehicleRaw.SeqRank),
                    ident: vehicleRaw.Ident,
                    paintColor: parseInt(vehicleRaw["Paint Color"]),
                    dataSetRef: dataSet["_id"],
                    activatedFeatures: [],
                    orderNr: x
                };

                vehicleData.activatedFeatures.push.apply(vehicleData.activatedFeatures, docs);

                var vehicle = new Vehicle(vehicleData);

                vehicle.save(function(err, doc) {
                    savedVehciles.push(doc);
                    counterVehicles--;

                    if(counterVehicles == 0) {
                        dataSet.ratios = savedRatios;
                        dataSet.vehicles = savedVehciles;

                        dataSet.vehiclesAmount = dataSet.vehicles.length;
                        dataSet.ratiosAmount = dataSet.ratios.length;
                        dataSet.description = dataSet.vehiclesAmount + " vehicles with " + dataSet.ratiosAmount + " ratios";

                        dataSet.save(function(err, doc) {
                            finishUpload(dataSet, res);
                        });
                    }
                });
            });
        })(x);
    }
}

function saveUploadedDataInDb(res, jsonData) {
    var dataSet = new DataSet();
    var counterRatio = jsonData.ratios.length;

    dataSet.save(function(err, doc) {
        var dataSetId = doc["_id"];
        var savedRatios = [];

        for(var i in jsonData.ratios) {
            (function(i) {
                var ratioRaw = jsonData.ratios[i];

                var ratioData = {
                    ratio: ratioRaw.Ratio,
                    prio: parseInt(ratioRaw.Prio),
                    ident: ratioRaw.Ident,
                    dataSetRef: dataSetId
                };

                var ratio = new Ratio(ratioData);

                ratio.save(function(err, doc) {
                    savedRatios.push(doc);
                    counterRatio--;

                    if(counterRatio == 0) {
                        saveCars(res, jsonData, dataSet, savedRatios)
                    }
                });
            })(i);
        }
    });
}

router.post('/uploadRoadef', function(req, res, next) {
    var form = new formidable.IncomingForm();
    var jsonData = {
        optimizationObjectives: [],
        paintBatchLimit: [],
        ratios: [],
        vehicles: []
    };

    form.parse(req, function (err, fields, files) {
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
                        if(validateUploadedJsonData(jsonData)) {
                            saveUploadedDataInDb(res, jsonData);
                        } else {
                            res.redirect("/dataupload?success=false");
                        }
                    });
            });
    });
});

function validateUploadedJsonData(jsonData) {
    var ratioIdents = [];
    for(var i in jsonData.ratios) {
        var ratio = jsonData.ratios[i];

        if(typeof ratio.Ratio === "undefined"
            || typeof ratio.Prio === "undefined"
            || typeof ratio.Ident === "undefined") {
            return false;
        }

        ratioIdents.push(ratio.Ident);
    }


    for(var i in jsonData.vehicles) {
        var vehicle = jsonData.vehicles[i];

        // Check normal field
        if(typeof vehicle.Date === "undefined"
            || typeof vehicle.SeqRank === "undefined"
            || typeof vehicle['Paint Color'] === "undefined") {
            return false;
        }

        // Check if all ratio constraints are defined in the vehicle
        for(var x in ratioIdents) {
            var ratioIdent = ratioIdents[x];

            if(typeof vehicle[ratioIdent] === "undefined") {
                return false;
            }
        }
    }

    return true;
}

module.exports = router;