'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($http, $scope, MapService, VesselProcessService, $interval, Session) {
        $scope.V_id = "413362260";
        $scope.sailor = 'admin';
        $scope.wInst = undefined;
        $scope.vVariables = undefined;
        if (Session.getEventId() === null) {
            Session.createEventId();
        }
        $.toaster({
            settings: {
                toaster: {
                    css: {
                        top: '10%',
                        left: '5%'
                    }
                },
                toast:
                    {
                        fade: {in: 'fast', out: 'slow'},

                        display: function ($toast) {
                            return $toast.fadeIn(settings.toast.fade.in);
                        },

                        remove: function ($toast, callback) {
                            return $toast.animate(
                                {
                                    opacity: '0',
                                    height: '0px'
                                },
                                {
                                    duration: settings.toast.fade.out,
                                    complete: callback
                                });
                        }
                    },
                timeout: 3000
            }
        });
        MapService.initMap();
        // $scope.doSearch = function () {
        //     MapService.doSearch();
        // };
        // $scope.doNavigation = function () {
        //     MapService.doNavigation();
        // };
        //
        // // 入口 ：
        // // 侦听流程实例，获取启动vessel-process Instances 的船号等信息
        var params = {
            params: {
                processDefinitionKey: 'process_pool4'
                // processDefinitionKey: 'process'

            }
        };
        var promise = VesselProcessService.GetProcessInstance(params);
        promise.then(function (data) {  // 调用承诺API获取数据 .resolve
            console.log("promise : success ",data);
            if (data.size != 0) {
                console.log("监听到车流程实例");
                $scope.wInst = data.data[0];
                console.log("$scope.wInst : " + $scope.wInst['id']);
                var pid = data.data[0].id;
                console.log(pid);
                var promise1 = VesselProcessService.GetProcessVariablesById(pid);
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

        var eventPromise = $interval(function () {
            $http.get(activityBasepath + '/sevents')
                .success(function (data) {
                    // console.log(data);
                    if (data.length > 0) {
                        data.sort(function sortNumber(a, b) {
                            return a.id - b.id
                        });
                        for (var i = 0; i < data.length; i++) {
                            var event = data[i];
                            // if (event.id > Session.getLastEventId()) {
                            //     Session.setlastEventId(event.id);
                            // }
                            if ('W_START' == event.type) {

                            }
                            if ('W_PLAN' == event.type) {
                                console.log("pid : ", event.data.W_Info.pid);
                                console.log("W_PLAN", event.data);
                                $scope.W_START_Handle(event);
                            }
                            if ('W_RUN' == event.type) {
                                console.log("W_RUN.pid", event.data);
                                MapService.doNavigation(event);
                            }
                            if ('W_Coord' == event.type) {

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
        $scope.startVessel = function () {
            var param = {
                params: {
                    name: 'Vessel'
                }
            };
            $http.get(activityBasepath + "/repository/process-definitions", param)
                .success(function (data) {
                    // console.log("all definitions : " , data);
                    var pdArray = data.data;
                    console.log("the newest version : ", pdArray[pdArray.length - 1]);
                    var curPd = pdArray[pdArray.length - 1];
                    var processData = {
                        processDefinitionId: curPd.id,
                        name: 'Vessel',
                        values: {
                            sailor: $scope.sailor,
                            V_id: $scope.V_id
                        }
                    };
                    $http.post(activityBasepath + "/rest/process-instances", processData)
                        .success(function (data) {
                            $.toaster("启动船实例",'Vessel','success');
                            console.log("启动船实例", data);
                            var pid = data.id;
                            VesselProcessService.GetProcessVariablesById(pid)
                                .then(function (data) {
                                    // console.log("variables : " , data);
                                   MapService.voyaging(pid,$scope.V_id, data);
                                });
                        });

                });
        };
    });


