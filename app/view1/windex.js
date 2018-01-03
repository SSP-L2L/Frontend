'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($http, $scope, MapService, VesselProcessService) {
        $scope.wInst = undefined;
        $scope.vVariables = undefined;

        MapService.initMap();
        $scope.doSearch = function () {
            MapService.doSearch();
        };
        $scope.doNavigation = function () {
            MapService.doNavigation();
        };

        // 入口 ：
        // var instTimer = $interval(function () {
        // 侦听流程实例，获取启动vessel-process Instances 的船号等信息
        var params = {
            params: {
                processDefinitionKey: 'process'
            }
        };
        var promise = VesselProcessService.GetProcessInstance(params);
        promise.then(function (data) {  // 调用承诺API获取数据 .resolve
            console.log("promise : success ");
            if (data.size != 0) {
                console.log("监听到车流程实例");
                $scope.wInst = data.data[0];
                console.log("$scope.wInst : " + $scope.wInst['id']);
                var pid = data.data[0].id;
                var promise1 = VesselProcessService.GetProcessVariablesById(data.data[0].id);
                promise1.then(function (data) {  // 调用承诺API获取数据 .resolve
                    console.log("promise : success ");
                    $scope.wVariables = data;
                    console.log("wVariables:" + $scope.wVariables);

                }, function (data) {  // 处理错误 .reject
                    console.error("promise : error");
                }).finally(function (data) {
                    console.log("promise : finally ");
                });
            } else {
                console.log("没有监听到流程实例！")
            }
        }, function (data) {  // 处理错误 .reject
            console.error("promise : error");
        }).finally(function (data) {
            console.log("promise : test ");
        });
        // }, 2000);
    });