'use strict';

// Declare app level module which depends on views, and components
var App = angular.module('myApp', [
    'ngRoute',
    'myApp.monitor',
    'myApp.version',
    'LocalStorageModule'
]).config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
    $locationProvider.hashPrefix('!');

    $routeProvider.otherwise({redirectTo: '/views'});
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


//router
'use strict';
//STOMP

angular.module('myApp.monitor', ['ngRoute' ])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/views', {
            templateUrl: 'views/monitor.html',
            controller: 'MonitorCtrl'
        });
    }])



