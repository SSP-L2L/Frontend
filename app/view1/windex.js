'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($http, $scope, MapService, VesselProcessService, $interval) {
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
        // glp

        $scope.lastEventId = 0;
        var eventPromise = $interval(function () {
            $http.get(activityBasepath + '/sevents/' + $scope.lastEventId)
                .success(function (data) {
                    console.log('events: ', data);
                    if (data.length > 0) {
                        data.sort(function sortNumber(a, b) {
                            return a.id - b.id
                        });
                        for (var i = 0; i < data.length; i++) {
                            var event = data[i];
                            if (event.id > $scope.lastEventId) {
                                $scope.lastEventId = event.id;
                            }
                            if ('W_START' == event.type) {

                            }
                            if ('W_PLAN' == event.type) {
                                console.log(event.id);
                                console.log(event.data);
                                $scope.W_START_Handle(event);
                            }
                        }
                    }
                });
        }, 2000);
        $scope.W_START_Handle = function (event) {
            console.log("W_START_Handle执行");
            if (event.data.W_Info.needPlan) {
                var origin = new AMap.LngLat(event.data.W_Info.x_Coor, event.data.W_Info.y_Coor);
                var destination = new AMap.LngLat(event.data.W_Info.w_TargLoc.x_coor, event.data.W_Info.w_TargLoc.y_coor);
                var deadline = event.data.W_Info.planRes;
                MapService.doSearch(origin, destination, deadline);
            }
        };
        var revent = {
            'type': eventType.RW_PLAN,
            'id': generateId(),
            'data': {
                'value': 10,
                'value2': 'ssss',
                'value3': {
                    'xx': 'x'
                }
            }
        };

        // revent.type = eventType.RW_PLAN;
        // revent.id = generateId();
        // revent.data = {
        //     // origin: [reSearchOrigin.getLng(), reSearchOrigin.getLat()],
        //     // destination: [reSearchDestination.getLng(), reSearchDestination.getLat()],
        //     // remainingTime: remainingTime,
        //     // estimatedTime: estimatedTime,
        //     // estimatedDistance: estimatedDistance
        //     value: 10
        // };
        // $http.post(activityBasepath + '/revents', revent)
        //     .success(function (data) {
        //         console.log("return result");
        //         console.log("return event : "+data[0].data);
        //     }).error(function (data) {
        //     console.log("fails")
        // });

    });


