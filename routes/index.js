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
var zip = require('express-zip');

var Parameter = mongoose.model('Parameter');
var DataSet = mongoose.model("DataSet");
var Vehicle = mongoose.model("Vehicle");
var TabuSearch = mongoose.model("TabuSearch");
var Ratio = mongoose.model("Ratio");
var OptimizationObjective = mongoose.model("OptimizationObjective");

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
                        value: sParam.value,
                        minValue: sParam.minValue,
                        maxValue: sParam.maxValue,
                        orderNr: sParam.orderNr
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
                        value: sParam.value,
                        minValue: sParam.minValue,
                        maxValue: sParam.maxValue,
                        orderNr: sParam.orderNr
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

        var sortedParameters  = parameters.sort(function(a, b) {
            if(a.orderNr > b.orderNr) {
                return 1;
            } else if(a.orderNr < b.orderNr) {
                return -1;
            } else {
                return 0;
            }
        });


        res.json(sortedParameters);
    });
});

router.get('/parameters', function(req, res) {
    Parameter.find({}, function(err, parameters) {
        res.json(parameters);
    });
});

router.post('/parameter', function(req, res) {
    Parameter.find({standard: true}, function(err, parameters) {
        var foundOrderNr = -1;
        for(var i in parameters) {
            var sParam = parameters[i];

            if(sParam.ident === req.body.ident) {
                foundOrderNr = sParam.orderNr;
            }
        }

        var newParam = new Parameter({
            standard: false,
            ident: req.body.ident,
            name: req.body.name,
            description: req.body.description,
            type: req.body.type,
            value: req.body.value,
            minValue: req.body.minValue,
            maxValue: req.body.maxValue,
            orderNr: foundOrderNr
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
});

router.get('/overviewdata', function(req, res) {
    res.render('overviewdata');
});

router.post('/overviewdata', function(req, res) {
    var responseObj = {
       tabusearches: [],
       standardParameters: [],
       datasetIds: []
    };

    TabuSearch.find({}).deepPopulate('optObjective parameters dataset').exec(function (err, tabusearches) {
        responseObj.tabusearches = tabusearches;

        Parameter.find({standard: true}, function(err, standardparameters) {
            var sortedParameters  = standardparameters.sort(function(a, b) {
                if(a.orderNr > b.orderNr) {
                    return 1;
                } else if(a.orderNr < b.orderNr) {
                    return -1;
                } else {
                    return 0;
                }
            });
            responseObj.standardParameters = sortedParameters;

            DataSet.find({}, "_id description timestamp", function(err, datasetIds) {
                responseObj.datasetIds = datasetIds;
                res.json(responseObj);
            });
        });
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

function saveDataSetAsRoadefInFileSystem(dataset) {
    // Check if ratios were already saved
    if(fs.existsSync("public/datasetDownloads/roadef/ratios-roadef-" + dataset._id + ".txt")) {
        return;
    }
    // Check if vehicles were already saved
    if(fs.existsSync("public/datasetDownloads/roadef/vehicles-roadef-" + dataset._id + ".txt")) {
        return;
    }

    var textFileLines = [[], []]; // 0 = Text lines of rations, 1 = Text lines of vehicles

    // Ratio
    var ratioFinalString = "Ratio;Prio;Ident;\n";
    var ratioIdents = "";
    for(var i in dataset.ratios) {
        var ratio = dataset.ratios[i];

        if(typeof ratio.ident !== "undefined") {
            ratioIdents += ratio.ident + ";";
            ratioFinalString += ratio.ratio + ";" + ratio.prio + ";" + ratio.ident + ";\n";
        }
    }

    // Vehicles - sort them firstly
    var vehicleFinalString = "Date;SeqRank;Ident;Paint Color;" + ratioIdents + "\n";
    dataset.vehicles = dataset.vehicles.sort(function(a, b) {
        if(a.orderNr > b.orderNr) {
            return 1;
        } else if(a.orderNr < b.orderNr) {
            return -1;
        } else {
            return 0;
        }
    });

    for(var i in dataset.vehicles) {
        var vehicle = dataset.vehicles[i];

        if(typeof vehicle.ident === "undefined") {
            continue;
        }

        var ratioBinaryString = "";
        for(var x in dataset.ratios) {
            var ratio = dataset.ratios[x];
            var ratioIsActivatedInVehicle = false;

            if(typeof ratio.ident === "undefined") {
                continue;
            }

            for(var y in vehicle.activatedFeatures) {
                var activatedFeature = vehicle.activatedFeatures[y];

                if(typeof activatedFeature.ident === "undefined") {
                    continue;
                }

                if(ratio.ident === activatedFeature.ident) {
                    ratioIsActivatedInVehicle = true;
                    break;
                }
            }

            if(ratioIsActivatedInVehicle) {
                ratioBinaryString += "1;";
            } else {
                ratioBinaryString += "0;";
            }
        }

        vehicleFinalString += vehicle.dateString + ";" + vehicle.seqRank + ";" + vehicle.ident + ";" + vehicle.paintColor + ";" + ratioBinaryString + "\n";

        fs.writeFile("public/datasetDownloads/roadef/ratios-roadef-" + dataset._id + ".txt", ratioFinalString, function(err) {
            if(err) {
                return console.log(err);
            }
        });
        fs.writeFile("public/datasetDownloads/roadef/vehicles-roadef-" + dataset._id + ".txt", vehicleFinalString, function(err) {
            if(err) {
                return console.log(err);
            }
        });
    }
}

router.get('/downloaddatasetroadef', function(req, res) {
    if(req.query.id === "exampleset") {
        res.zip([
            {path: "public/datasetDownloads/roadef/ratios-roadef-exampleset.txt", name: "ratios-roadef-" + req.query.id + ".txt"},
            {path: "public/datasetDownloads/roadef/vehicles-roadef-exampleset.txt", name: "vehicles-roadef-" + req.query.id + ".txt"}
        ], "ITS-ROADEF-Data.zip");
    } else {
        DataSet.findById({"_id": req.query.id}, function(err, dataset) {
            if(dataset) {
                dataset.deepPopulate("ratios vehicles vehicles.activatedFeatures", function(err, enrichedDataset) {
                    saveDataSetAsRoadefInFileSystem(enrichedDataset);
                    res.zip([
                        {path: "public/datasetDownloads/roadef/ratios-roadef-" + req.query.id + ".txt", name: "ratios-roadef-" + req.query.id + ".txt"},
                        {path: "public/datasetDownloads/roadef/vehicles-roadef-" + req.query.id + ".txt", name: "vehicles-roadef-" + req.query.id + ".txt"}
                    ], "ITS-ROADEF-Data.zip");
                });
            }
        });
    }
});

router.get('/downloadpresentationfiles', function(req, res) {
    res.zip([
        {path: "public/presentation/Car-Sequencing_Seminar2018.pdf", name: "Car-Sequencing_Seminar2018.pdf"},
        {path: "public/presentation/Car-Sequencing_Seminar2018.pptx", name: "Car-Sequencing_Seminar2018.pptx"},
        {path: "public/presentation/Car-Sequencing_Seminar2018-Handout_v2.pdf", name: "Car-Sequencing_Seminar2018-Handout_v2.pdf"}
    ], "CS-ITS-presentation.zip");
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

router.get('/gettabusearch', function(req, res) {
    TabuSearch.findById({"_id": req.query.id}, function(err, tabusearch) {
        if(tabusearch) {
            tabusearch.deepPopulate("dataset dataset.ratios dataset.vehicles dataset.vehicles.activatedFeatures " +
                "optObjective parameters", function(err, data) {

                res.json(data);
            });
        } else {
            res.status(404);
            res.end();
        }
    });
});

router.get('/tabusearches', function(req, res) {
    TabuSearch.find({}, function(err, datasets) {
        res.json(datasets);
    });
});

router.post('/tabusearch', function(req, res) {
    var saveTabuSearchCounter = 0;

    var tabuSearch = new TabuSearch({
        dataset: null,
        optObjective: null,
        parameters: []
    });

    // Find referenced dataset
    DataSet.findById({"_id": req.body.dataSetId}, function(err, dataset) {
        if(dataset) {
            tabuSearch.dataset = dataset;
            saveTabuSearch(tabuSearch, res);
        } else {
            res.status(404);
            res.end();
        }
    });

    // Save ordered optimization objectives
    var optObjective = new OptimizationObjective({
        high_priority: 1000,
        low_priority: 1000,
        high_low_priority: 1000,
        paint_color_batches: 1000,
        orderArray: req.body.optimizationObjectiveOrder,
        orderDisplayingNames: []
    });

    if(req.body.optimizationObjectiveOrder.length == 3) {
        for(var i in req.body.optimizationObjectiveOrder) {
            var optObj = req.body.optimizationObjectiveOrder[i];

            if(optObj === "high_priority") {
                optObjective.high_priority = i;
                optObjective.orderDisplayingNames.push("High priority ratio constraints");
            } else if(optObj === "low_priority") {
                optObjective.low_priority = i;
                optObjective.orderDisplayingNames.push("Low priority ratio constraints");
            } else {
                optObjective.paint_color_batches = i;
                optObjective.orderDisplayingNames.push("Paint color batches");
            }
        }
    } else {
        // Low and high priority objectives were merged by the user
        for(var i in req.body.optimizationObjectiveOrder) {
            var optObj = req.body.optimizationObjectiveOrder[i];

            if(optObj === "high_priority" || optObj === "low_priority") {
                optObjective.high_low_priority = i;
                optObjective.orderDisplayingNames.push("High & low priority ratio constraints");
            } else {
                optObjective.paint_color_batches = i;
                optObjective.orderDisplayingNames.push("Paint color batches");
            }
        }
    }

    optObjective.save(function(err, doc) {
        tabuSearch.optObjective = doc;
        saveTabuSearch(tabuSearch, res);
    });

    // Get referenced parameters
    Parameter.find({
        "_id": {
            $in: req.body.parameterIds
        }
    }, function(err, parameterDocs) {
        var sortedParameters  = parameterDocs.sort(function(a, b) {
            if(a.orderNr > b.orderNr) {
                return 1;
            } else if(a.orderNr < b.orderNr) {
                return -1;
            } else {
                return 0;
            }
        });

        tabuSearch.parameters.push.apply(tabuSearch.parameters, sortedParameters);
        saveTabuSearch(tabuSearch, res);
    });

    function saveTabuSearch(tabusearch, res) {
        saveTabuSearchCounter++;

        if(saveTabuSearchCounter == 3) {
            saveTabuSearchCounter = 0;

            tabusearch.save(function(err, doc) {
                res.json(doc);
            });
        }
    }
});

module.exports = router;