var tabuController = angular.module('integratedTabuSearchApp', []);

function ParameterSet(parameters) {
    this.parameters = parameters;
}

function Solution(vehicles) {
    this.vehicles = cloneVehicles(vehicles);

    this.actColourChanges = 0;
    this.actColourViolations = 0;
    this.actLowPrioViolations = 0;
    this.actHighPrioViolations = 0;

    this.updateActViolations = function() {
        // 1. Count colour changes

        // 2. Calc colour violations

        // 3. Calc low priority violations

        // 4. Calc high priority violations
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
            dataSetRef: v.dataSetRef,
            dateString: v.dateString,
            ident: v.ident,
            orderNr: v.orderNr,
            paintColor: v.paintColor,
            seqRank: v.seqRank,
            _id: v._id
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

        var s1 = new Solution(data.dataset.vehicles);
        var s2 = new Solution(data.dataset.vehicles);
        s2.vehicles[0] = {};
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