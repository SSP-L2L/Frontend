'use strict';

// Declare app level module which depends on views, and components
var App = angular.module('myApp', [
    'ngRoute',
    'myApp.view1',
    'myApp.version',
    'LocalStorageModule'
]).config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');

    $routeProvider.otherwise({redirectTo: '/view1'});
}]);
App.config(function (localStorageServiceProvider) {
    localStorageServiceProvider
        .setPrefix('VW')
        .setStorageType('sessionStorage')
        .setNotify(true,true)
});
App.config(function (localStorageServiceProvider) {
    localStorageServiceProvider.setDefaultToCookie(false);
})
