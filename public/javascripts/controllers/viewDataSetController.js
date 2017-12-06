var dataSetController = angular.module('integratedTabuSearchApp', []);

dataSetController.controller("viewDataSetController", function ($scope, $http, $location) {
    var id = $location.search().id;
    if(typeof id === "string") {
        $scope.id = id;

        var requestUrl = "/dataset?id=" + id;
        console.log(requestUrl);
        var request = $http.get(requestUrl);
        request.success(function(data) {
            $scope.dataset = data;
            console.log(data);
        });
        request.error(function(err){
            console.log('Error: ' + err);
        });
    }
});