var dataSetController = angular.module('integratedTabuSearchApp', []);

dataSetController.controller("viewDataSetController", function ($scope, $http, $location) {
    var id = $location.search().id;
    if(typeof id === "string") {
        $scope.id = id;

        var requestUrl = "/dataset?id=" + id;
        var request = $http.get(requestUrl);
        request.success(function(data) {
            enrichDataset(data);
            $scope.dataset = data;


            console.log(data);
        });
        request.error(function(err){
            console.log('Error: ' + err);
        });
    }

    function enrichDataset(dataset) {
        dataset.parsedTimestamp = new Date(dataset.timestamp).toLocaleDateString()
                                    + ", " + new Date(dataset.timestamp).toLocaleTimeString();
    }
});