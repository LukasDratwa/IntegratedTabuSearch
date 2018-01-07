var tabuController = angular.module('integratedTabuSearchApp', []);

function ParameterSet(parameters) {
    this.parameters = parameters;

    this.getParamWithIdent = function(ident) {
        for(var i in this.parameters) {
            if(this.parameters[i].ident === ident) {
                return this.parameters[i];
            }
        }

        return null;
    };
}

function RatioSet(ratios) {
    this.ratios = ratios;

    this.getRatioIntValues = function(ratio) {
        var result = [];
        var splitted = ratio.ratio.split("/");
        result.push(parseInt(splitted[0]));
        result.push(parseInt(splitted[1]));

        return result;
    };
}

function Solution(vehicles, parameters, ratios) {
    this.vehicles = cloneVehicles(vehicles);
    this.parameterSet = new ParameterSet(parameters);
    this.ratioSet = new RatioSet(ratios);

    this.actColorChanges = 0;
    this.actColorViolations = 0;
    this.actLowPrioViolations = [];
    this.actHighPrioViolations = [];

    this.getNextPaintGroupVehicle = function(vehicle) {
        var foundParamVehicle = false;

        for(var i in this.vehicles) {
            var v = this.vehicles[i];

            if(v._id === vehicle._id) {
                foundParamVehicle = true;
            }

            if(foundParamVehicle && v.paintColor != vehicle.paintColor) {
                return v;
            }
        }

        return null;
    };

    this.getSubSeq = function(startIndex, length) {
        var result = [];

        for(var i=startIndex; i<startIndex+length; i++) {
            if(result.length == length) {
                break;
            }

            if(i <= this.vehicles.length-1) {
                var vehicle = this.vehicles[i];
                result.push(vehicle);
            }
        }

        return result;
    };

    this.updateActViolations = function() {
        // 1. Count color changes
        var lastColor = -1;
        for(var i in this.vehicles) {
            var v = vehicles[i];

            if(lastColor == -1) {
                lastColor = v.paintColor;
                continue;
            }

            if(v.paintColor != lastColor) {
                this.actColorChanges++;
            }

            lastColor = v.paintColor;
        }

        // 2. Calc color violations
        var paramLota = this.parameterSet.getParamWithIdent("l");
        var nextPaintGroupVehicle = this.vehicles[0];
        var counterPaintGroups = 0;
        while(nextPaintGroupVehicle != null) {
            counterPaintGroups++;
            var restPaintGroupSize = nextPaintGroupVehicle.sizePaintGroup;

            while(restPaintGroupSize > paramLota.value) {
                restPaintGroupSize = restPaintGroupSize - paramLota.value;
                this.actColorViolations++;
            }

            nextPaintGroupVehicle = this.getNextPaintGroupVehicle(nextPaintGroupVehicle);
        }
        // console.log("Checked " + counterPaintGroups + " paint groups");

        // 3. Calc low priority violations && 4. Calc high priority violations
        for(var i in this.ratioSet.ratios) {
            var ratio = this.ratioSet.ratios[i];
            var ratioValues = this.ratioSet.getRatioIntValues(ratio);

            for(var x in this.vehicles) {
                var vehicle = this.vehicles[x];

                var subSequence = this.getSubSeq(x, ratioValues[1]);
            }
        }
    };

    this.obligatoryUpdateAfterEveryMove = function() {
        // 1. Every car should know how big their colour-group is
        var carsToUpdate = [];
        var actPaintGroupColour = -1;
        var paintGroupCounter = 1;

        for(var i in this.vehicles) {
            var v = this.vehicles[i];

            if(v.paintColor != actPaintGroupColour) {
                actPaintGroupColour = v.paintColor;

                for(var x in carsToUpdate) {
                    var index = carsToUpdate[x];
                    this.vehicles[index].sizePaintGroup = paintGroupCounter;
                }

                paintGroupCounter = 1;
                carsToUpdate = [];

                // Special case that the next car will be too in another colour
                if(i < this.vehicles.length-1 && this.vehicles[parseInt(i)+1].paintColor != actPaintGroupColour) {
                    v.sizePaintGroup = 1;
                } else if(i < this.vehicles.length-1 && this.vehicles[parseInt(i)+1].paintColor == actPaintGroupColour) {
                    // Fix that the first car of every paint group wasn't updated
                    carsToUpdate.push(i);
                }

                // Special case that the last car is alone in its paint group
                if(i == this.vehicles.length-1 && carsToUpdate.length == 0) {
                    v.sizePaintGroup = 1;
                }
            } else {
                carsToUpdate.push(i);
                paintGroupCounter++;
            }
        }

        if(carsToUpdate.length > 0) {
            for(var x in carsToUpdate) {
                var index = carsToUpdate[x];
                this.vehicles[index].sizePaintGroup = paintGroupCounter;
            }
        }
        // EOF 1.
    };
    this.obligatoryUpdateAfterEveryMove();
    this.updateActViolations();

    this.insertVehicle = function(index, vehicle) {
        this.vehicles.splice(index, 0, vehicle);
        return this;
    };

    this.swapVehicles = function(firstIndex, secondIndex) {
        var tmpVehicle = this.vehicles[firstIndex];
        this.vehicles[firstIndex] = this.vehicles[secondIndex];
        this.vehicles[secondIndex] = this.vehicles[firstIndex];
        return this;
    };

    this.getIndexOfVehicleInS = function(vehicle) {
        for(var i in this.vehicles) {
            var tmp = this.vehicles[i];
            if(vehicle._id === tmp._id) {
                return tmp;
            }
        }

        return null;
    };
}

function Iteration() {

}

function cloneActivatedFeatures(activatedFeatures) {
    var result = [];

    for(var i in activatedFeatures) {
        var f = activatedFeatures[i];

        result.push({
            dataSetRef: f.dataSetRef,
            ident: f.ident,
            prio: f.prio,
            ratio: f.ratio,
            _id: f._id
        });
    }

    return result;
}

function cloneVehicles(vehicles) {
    var result = [];

    for(var i in vehicles) {
        var v = vehicles[i];

        result.push({
            activatedFeatures: cloneActivatedFeatures(v.activatedFeatures),
            dateString: v.dateString,
            ident: v.ident,
            orderNr: v.orderNr,
            paintColor: v.paintColor,
            seqRank: v.seqRank,
            _id: v._id,
            dataSetRef: v.dataSetRef
        });
    }

    return result;
}

tabuController.controller("integratedTabuSearchController", function ($scope, $http, $location) {
    function performITS(data) {
        // !! Sort the vehicles
        data.dataset.vehicles.sort(function(a, b) {
            if(a.orderNr > b.orderNr) {
                return 1;
            } else if(a.orderNr < b.orderNr) {
                return -1;
            } else {
                return 0;
            }
        });

        console.log("Start ITS: " , data);

        var s1 = new Solution(data.dataset.vehicles, data.parameters, data.dataset.ratios);
        var s2 = new Solution(data.dataset.vehicles, data.parameters, data.dataset.ratios);
        console.log(s1);

        $scope.standardParameters = data.parameters;
        $scope.dataset = data.dataset;
        $scope.optObjectives = data.optObjective;
        $scope.optObjectivesNames = data.optObjective.orderDisplayingNames;
    }

    var id = $location.search().id;
    $scope.performTabuSearch = false;
    $scope.selectedDatasetId = "";
    $scope.datasets = [];
    $scope.standardParameters = [];

    if(typeof id === "string") {
        // Performed Start of tabu search
        $scope.performTabuSearch = true;
        var tabuSearchRequest = $http.get('/gettabusearch?id=' + id);
        tabuSearchRequest.success(function(data) {
            performITS(data);
        });
        tabuSearchRequest.error(function(err){
            console.log('Error: ' + err);
        });
    } else {
        // Config add in view
        var datasetRequest = $http.get('/alldatasetids');
        datasetRequest.success(function(data) {
            for(var i in data) {
                $scope.datasets.push(data[i]);
            }
        });
        datasetRequest.error(function(err){
            console.log('Error: ' + err);
        });

        var standardParameterRequest = $http.get('/standardparameters');
        standardParameterRequest.success(function(data) {
            for(var i in data) {
                $scope.standardParameters.push(data[i]);
            }

            console.log("StandardParameters " , $scope.standardParameters);
        });
        standardParameterRequest.error(function(err){
            console.log('Error: ' + err);
        });
    }
});