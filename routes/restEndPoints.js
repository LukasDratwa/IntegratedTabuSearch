/**
 * @author Lukas Dratwa
 *
 * Created on 22.11.2017.
 */

var express = require('express');
var fs = require('fs');
var router = express.Router();
var config = require('../config.json');

var mongoose = require('mongoose');
var DataSet = mongoose.model("DataSet");
var OptimizationObjective = mongoose.model("OptimizationObjective");
var Parameter = mongoose.model("Parameter");
var Ratio = mongoose.model("Ratio");
var Vehicle = mongoose.model("Vehicle");

router.post("/dataSet", function(req, res, err) {
    var dataSet = new DataSet(req.body);

    dataSet.save(function(err, doc) {
        res.json(doc);
    });
});

router.post("/optObjective", function(req, res, err) {
    var objective = new OptimizationObjective(req.body);

    objective.save(function(err, doc) {
        res.json(doc);
    });
});

router.post("/ratio", function(req, res, err) {
    var ratio = new Ratio(req.body);

    ratio.save(function(err, doc) {
        res.json(doc);
    });
});

router.post("/vehicle", function(req, res, err) {
    var vehicle = new Vehicle(req.body);

    Ratio.find({
        "ident": {
            $in: req.body.activatedFeatureIdents
        }
    }, function(err, docs) {
        vehicle.activatedFeatures.push.apply(vehicle.activatedFeatures, docs);

        vehicle.save(function(err, doc) {
            res.json(doc);
        });
    });
});

router.get("/vehicles", function(req, res, err) {
    Vehicle.find({}, function(err, docs) {
        res.json(docs);
    });
});

module.exports = router;