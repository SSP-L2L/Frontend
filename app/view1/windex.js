'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($http, $scope, MapService) {
        MapService.initMap();
        $scope.doSearch = function(){
            MapService.doSearch();
        };
        $scope.doNavigation = function(){
            MapService.doNavigation();
        };
    });