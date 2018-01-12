var tabuController = angular.module('integratedTabuSearchApp', []);

tabuController.controller("integratedTabuSearchController", function ($scope, $http, $location) {
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

            $scope.parameterKappa = 0;
            for(var i in data.parameters) {
                if(data.parameters[i].ident === "k") {
                    $scope.parameterKappa = data.parameters[i].value;
                    break;
                }
            }

            $scope.standardParameters = data.parameters;
            $scope.dataset = data.dataset;
            $scope.optObjectives = data.optObjective;
            $scope.optObjectivesNames = data.optObjective.orderDisplayingNames;

            $scope.initialSolution = {};

            $scope.improvedSolutionFound = false;
            $scope.improvedSolution = {};

            $scope.iterations = [];

            $scope.logs = [];

            $scope.bestSolutionFound = false;
            $scope.bestSolution = {};

            window.setTimeout(function() {
                if(window.Worker) {
                    var itsWorkerThread = new Worker("/javascripts/iteratedTabuSearchAlgorithm.js");
                    itsWorkerThread.postMessage(data);

                    itsWorkerThread.onmessage = function(e) {
                        console.log('Message received from worker' , e.data);

                        if(e.data.ident === "INITIAL") {
                            $scope.initialSolution.additionalInformation = e.data.additionalInformation;
                            $scope.initialSolution.vehicleOrder = e.data.vehicleOrder;
                            $scope.$apply();
                        }

                        if(e.data.ident === "IMPROVED") {
                            $scope.improvedSolutionFound = true;
                            $scope.improvedSolution.additionalInformation = e.data.additionalInformation;
                            $scope.improvedSolution.vehicleOrder = e.data.vehicleOrder;
                            $scope.$apply();
                        }

                        if(e.data.ident === "ITERATION") {
                            $scope.iterations.push(e.data);
                            $scope.$apply();
                        }

                        if(e.data.ident === "END") {
                            $scope.bestSolutionFound = true;
                            $scope.bestSolution = e.data;
                            $scope.$apply();
                        }
                    };
                }
            }, 1000);
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