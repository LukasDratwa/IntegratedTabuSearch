var dataSetController = angular.module('integratedTabuSearchApp', []);

dataSetController.controller("dataOverviewController", function ($scope, $http, $location) {
    var requestUrl = "/overviewdata";
    var request = $http.post(requestUrl);
    request.success(function(data) {
        $scope.data = data;
        enrichData(data);

        console.log(data);
    });
    request.error(function(err){
        console.log('Error: ' + err);
    });

    function enrichData(data) {
        // Datasets
        for(var i in data.datasetIds) {
            var datasetId = data.datasetIds[i];
            datasetId.nr = parseInt(i) + 1;

            datasetId.parsedTimestamp = new Date(datasetId.timestamp).toLocaleDateString()
                + ", " + new Date(datasetId.timestamp).toLocaleTimeString();
        }

        // Tabusearches
        for(var i in data.tabusearches) {
            var tabusearch = data.tabusearches[i];
            tabusearch.nr = parseInt(i) + 1;

            tabusearch.parsedTimestamp = new Date(datasetId.timestamp).toLocaleDateString()
                + ", " + new Date(datasetId.timestamp).toLocaleTimeString();
        }
    }
});