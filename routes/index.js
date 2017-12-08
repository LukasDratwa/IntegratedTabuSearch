/**
 * @author Lukas Dratwa
 *
 * Created on 15.11.2017.
 */

var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');
var mongoose = require('mongoose');
var csv = require('csvtojson');
var config = require('../config.json');

var Parameter = mongoose.model('Parameter');
var DataSet = mongoose.model("DataSet");
var Vehicle = mongoose.model("Vehicle");
var TabuSearch = mongoose.model("TabuSearch");
var Ratio = mongoose.model("Ratio");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Iterated Tabu Search' });
});

router.get('/checkdefaultparameters', function (req, res, next) {
    console.log("Check for default params...");
    for(var i in config.standardparameter) {
        var sParam = config.standardparameter[i];

        (function(sParam) {
            Parameter.findOne({standard: true, ident: sParam.ident}, function (err, doc) {
                if(! doc) {
                    var newSParam = new Parameter({
                        standard: true,
                        ident: sParam.ident,
                        name: sParam.name,
                        description: sParam.description,
                        type: sParam.type,
                        value: sParam.value
                    });

                    newSParam.save(function(err, param) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log("Created new param: " + param.name);
                        }
                    });
                }
            });
        })(sParam);
    }

    res.sendStatus(200);
    res.end();
});

router.get('/checkdefaultparametervalues', function (req, res, next) {
    console.log("Check for default param values...");

    for(var i in config.standardparameter) {
        var sParam = config.standardparameter[i];

        (function(sParam) {
            Parameter.findOne({ident: sParam.ident}, function (err, doc) {
                if(doc) {
                    doc.name = sParam.name;
                    doc.set({
                        name: sParam.name,
                        description: sParam.description,
                        type: sParam.type,
                        value: sParam.value
                    });

                    doc.save(function(err, param) {
                        if(err) {
                            console.log(err);
                        } else {
                            console.log("Updated param: " + param.name);
                        }
                    });
                }
            });
        })(sParam);
    }

    res.sendStatus(200);
    res.end();
});

router.get('/standardparameters', function (req, res) {
    Parameter.find({standard: true}, function(err, parameters) {
        res.json(parameters);
    });
});

router.get('/parameters', function(req, res) {
    Parameter.find({}, function(err, parameters) {
        res.json(parameters);
    });
});

router.post('/parameter', function(req, res) {
    var newParam = new Parameter({
        standard: false,
        ident: req.body.ident,
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        value: req.body.value
    });

    newParam.save(function(err, param) {
        if(err) {
            console.log(err);
        } else {
            console.log("Created new param: " + param.name);
            res.json(param);
        }
    });
});

/**
 * It's obligatory that a '#' is inserted before the query parameters to get these
 * within the angular controller.
 * http://localhost:8080/viewdataset#?id=5a27c790b7e065186c73d440#%3Fid
 */
router.get('/viewdataset', function (req, res) {
    res.render('viewdataset');
});

router.get('/dataset', function(req, res) {
    DataSet.findById({"_id": req.query.id}, function(err, dataset) {
        if(dataset) {
            dataset.deepPopulate("ratios vehicles vehicles.activatedFeatures", function(err, data) {

                data.vehicles = data.vehicles.sort(function(a, b) {
                    if(a.orderNr > b.orderNr) {
                        return 1;
                    } else if(a.orderNr < b.orderNr) {
                        return -1;
                    } else {
                        return 0;
                    }
                });

                res.json(data);
            });
        } else {
            res.status(404);
            res.end();
        }
    });
});

router.get('/alldatasetids', function(req, res) {
    DataSet.find({}, "_id description", function(err, datasets) {
        res.json(datasets);
    });
});

router.get('/tabusearch', function(req, res, next) {
    res.render('tabusearch', { title: 'Iterated Tabu Search' });
});

router.get('/tabusearches', function(req, res) {
    TabuSearch.find({}, function(err, datasets) {
        res.json(datasets);
    });
});

router.post('/tabusearch', function(req, res) {
    var newTabuSearch = {

    };

    /*dataset: { type: mongoose.Schema.Types.ObjectId, ref: "DataSet" },
    optObjective: { type: mongoose.Schema.Types.ObjectId, ref: "OptimizationObjective" },
    parameters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Parameter" }]*/
});

module.exports = router;