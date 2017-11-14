var tabuController = angular.module('integratedTabuSearchApp', []);

tabuController.controller("integratedTabuSearchController", function ($scope, $http) {
    $scope.test = "test";

    console.log($scope.test);

    $scope.data = [];
    var request = $http.get('/datatest');
    request.success(function(data) {
        $scope.data = data;
    });
    request.error(function(data){
        console.log('Error: ' + data);
    });
});