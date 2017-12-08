var tabuController = angular.module('integratedTabuSearchApp', []);

tabuController.controller("integratedTabuSearchController", function ($scope, $http) {

    $scope.selectedDatasetId = "";
    $scope.datasets = [];
    var datasetRequest = $http.get('/alldatasetids');
    datasetRequest.success(function(data) {
        for(var i in data) {
            $scope.datasets.push(data[i]);
        }
    });
    datasetRequest.error(function(err){
        console.log('Error: ' + err);
    });


    $scope.standardParameters = [];
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
});