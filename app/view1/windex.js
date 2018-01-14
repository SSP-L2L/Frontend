'use strict';

angular.module('myApp.view1', ['ngRoute'])

    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/view1', {
            templateUrl: 'view1/view1.html',
            controller: 'View1Ctrl'
        });
    }])

    .controller('View1Ctrl', function ($http, $scope, MapService, MapFactory, VesselProcessService, $interval, Session, $filter) {
        $scope.V_id = "413362260";  //船的id
        $scope.sailor = 'admin';    //操作员
        $scope.wInst = undefined;   //
        $scope.vVariables = undefined;  //
        //Voyaging
        $scope.delay = -1;  //
        $scope.vti = {};    //
        $scope.ZoomInVal = 24 * 60 * 60 * 1000 / 60000; // 1day --> 1min  //比例换算
        $scope.portIdx = {};    //
        $scope.cnt = -1;    //
        $scope.ports = {};  //
        $scope.pvars = {};  //
        $scope.pIdxs = {};    //
        $scope.marker = {};   //
        $scope.vState = {}; //
        $scope.pid = {};  //
        $scope.ADTi = {};
        if (Session.getEventId() === null) {
            Session.createEventId();
        }
        MapService.initMap();
        // 入口 ：
        // 侦听流程实例，获取启动vessel-process Instances 的船号等信息
        var params = {
            params: {
                processDefinitionKey: 'process_pool4'
                // processDefinitionKey: 'process'

            }
        };
        var promise = VesselProcessService.GetProcessInstance(params);
        promise.then(function (data) {  // 调用承诺API获取数据 .resolve
            console.log("promise : success ", data);
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
                                // console.log("pid : ", event.data.W_Info.pid);
                                // console.log("W_PLAN", event.data);
                                // $scope.W_START_Handle(event);
                            }
                            if ('W_RUN' == event.type) {
                                console.log("W_RUN.pid", event.data);
                                $scope.W_START_Handle(event);
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
                // var deadline = event.data.W_Info.planRes;
                var deadline = 1000000;
                MapService.doSearch(origin, destination, deadline);
                // $interval(function () {
                //     console.log("NavigationFlag",NavigationFlag);
                //     if (NavigationFlag) {
                //         MapService.doNavigation(event);
                //     }
                // }, 1000);
                MapService.doNavigation(event);
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
                            $.toaster("启动船实例", 'Vessel', 'success');
                            console.log("启动船实例", data);
                            var pid = data.id;
                            VesselProcessService.GetProcessVariablesById(pid)
                                .then(function (data) {
                                    // console.log("variables : " , data);
                                    $scope.voyaging(pid, $scope.V_id, data);
                                });
                        });

                });
        };


        $scope.voyaging = function (pid, nowVid, vars) {
            console.log('vars:', vars);
            //vVariables = vars;
            // 定位模块

            $scope.vdata = vids[nowVid]; // 船的数据
            $scope.len = $scope.vdata.length;
            $scope.ports = port[nowVid];// 港口数据
            $scope.portIdx = 0;
            $scope.pvars = vars;
            $scope.pid = pid;

            // console.log($scope.vdata[1][1]);
            $scope.marker = new AMap.Marker({ // 加点
                map: map,
                position: [$scope.vdata[0][1], $scope.vdata[0][2]]
            });
            /*
             * 初始化船的一些信息
             */
            // var isVoya = 1; //0---船在其他状态， 1---船正在某一段航行

            // console.log("glp $scope.pvars: ", $scope.pvars);
            $scope.pIdxs = VesselProcessService.FindVarIdxByName($scope.pvars);
            // console.log("pIdxs" + pIdxs);
            // $scope.pvars[$scope.pIdxs['V_TargLoc']]['value'] = {
            //     'lname': $scope.ports[$scope.ports.length - 1][0],
            //     'x_coor': $scope.ports[$scope.ports.length - 1][1],
            //     'y_coor': $scope.ports[$scope.ports.length - 1][2],
            //     'realTime': $scope.ports[$scope.ports.length - 1][3]
            // };
            //设置每段的起始港口
            // $scope.pvars[$scope.pIdxs['PrePort']]['value'] = {
            //     'lname': '起点',
            //     'x_coor': $scope.vdata[0][1],
            //     'y_coor': $scope.vdata[0][2],
            //     'realTime': $scope.vdata[0][3]
            // };
            // 设置初始NextPort
            // $scope.pvars[$scope.pIdxs['NextPort']]['value'] = {
            //     'lname': $scope.ports[$scope.portIdx][0],
            //     'x_coor': $scope.ports[$scope.portIdx][1],
            //     'y_coor': $scope.ports[$scope.portIdx][2],
            //     'realTime': $scope.ports[$scope.portIdx][3]
            // };
            // 设置初始NowLoc
            $scope.pvars[$scope.pIdxs['NowLoc']]['value'] = {
                'lname': "未知",
                'x_coor': $scope.vdata[0][1],
                'y_coor': $scope.vdata[0][2],
                'timeStamp': 0,
                'velocity': $scope.vdata[0][4]
            };
            //初始化TargLocList
            for(var i in  $scope.ports){
                // console.log($scope.pvars[$scope.pIdxs['StartTime']].value);
                var ms = Date.parse($scope.pvars[$scope.pIdxs['StartTime']].value) + Date.parse($scope.ports[i][3]) - Date.parse($scope.vdata[0][3]);
                //加上默认等待时间
                ms += i*12*60*60*1000;
                var d = new Date();
                d.setTime(ms);
                var e_date = '';
                var s_date = '';
                if (d != 'Invalid Date') {
                    s_date = $filter('date')(d, "yyyy-MM-dd HH:mm:ss");
                    d.setTime(ms+12*60*60*1000);
                    e_date = $filter('date')(d, "yyyy-MM-dd HH:mm:ss");
                }
                $scope.pvars[$scope.pIdxs['TargLocList']].value[i].estart=s_date;
                $scope.pvars[$scope.pIdxs['TargLocList']].value[i].eend=e_date;
                // console.log("TargLocList:",$scope.pvars[$scope.pIdxs['TargLocList']]);

            }

            // 开始航行 , 间歇式传送数据到流程引擎
            $scope.delay = 0;
            //$scope.delay = (Date.parse($scope.vdata[$scope.cnt+1][3]) - Date.parse($scope.vdata[$scope.cnt][3]))/$scope.ZoomInVal;
            $scope.cnt = 0; // 循环次数
        };


        $scope.$watch('cnt', function (newCnt) {
            // console.log("new Delay", $scope.delay);
            // console.log("oldDelay",oldDelay);
            if ($scope.cnt !== -1) {
                // console.log("diyici : ", $scope.delay);
                $scope.vti = $interval(function () {
                    $scope.vState = $scope.pvars[$scope.pIdxs['State']]['value'];
                    // console.log("$scope.vState:", $scope.vState);
                    if ($scope.vState == 'voyaging') {// 进入voyaging 就开始PUT
                        // ，初始时流程启动，就开始PUT
                        // 上传流程变量
                        // 判断是否到达next_port;
                        if ($scope.vdata[$scope.cnt][1] == $scope.ports[$scope.portIdx][1] && $scope.vdata[$scope.cnt][2] == $scope.ports[$scope.portIdx][2]) {
                            $.toaster('<---------到达港口--------->', 'Vessel', 'success');
                            console.log("<---------到达港口--------->");
                            $scope.portIdx++;
                            if ($scope.portIdx < $scope.ports.length) {
                                $scope.pvars[$scope.pIdxs['PrePort']]['value'] = angular.copy($scope.pvars[$scope.pIdxs['NextPort']]['value']);
                                $scope.pvars[$scope.pIdxs['NextPort']]['value'] = {
                                    'lname': $scope.ports[$scope.portIdx][0],
                                    'x_coor': $scope.ports[$scope.portIdx][1],
                                    'y_coor': $scope.ports[$scope.portIdx][2],
                                    'realTime': $scope.ports[$scope.portIdx][3]
                                };
                            }
                            // 到了港口，就设置 船进入其他状态
                            $scope.pvars[$scope.pIdxs['State']]['value'] = 'arrival';
                            $scope.vState = 'arrival';
                            //更换港口图标
                            for(var i=0;i<portMarkers.length;i++){
                                if(portMarkers[i].title===$scope.vdata[$scope.cnt][0]){
                                    portMarkers[i].icon=uselessPort64;
                                }
                            }
                        }
                        // 修改流程变量---Now_loc
                        $scope.pvars[$scope.pIdxs['NowLoc']]['value'] = {
                            'lname': null,
                            'x_coor': $scope.vdata[$scope.cnt][1],
                            'y_coor': $scope.vdata[$scope.cnt][2],
                            'timeStamp': Date.parse($scope.vdata[$scope.cnt][3]) - Date.parse($scope.pvars[$scope.pIdxs['PrePort']]['value']['realTime']),
                            'velocity': $scope.vdata[$scope.cnt][4]
                        };
                        // $.toaster("NowLoc.timeStamp : " + $scope.pvars[$scope.pIdxs['NowLoc']]['value']['timeStamp'],'Vessel','info');
                        // console.log("NowLoc.timeStamp : " + $scope.pvars[$scope.pIdxs['NowLoc']]['value']['timeStamp']);
                        if ($scope.cnt < $scope.len) {
                            $scope.marker.hide();
                            $scope.marker = new AMap.Marker({ // 加点
                                map: map,
                                position: [$scope.vdata[$scope.cnt][1], $scope.vdata[$scope.cnt][2]],
                                icon: new AMap.Icon({ // 复杂图标
                                    size: new AMap.Size(64, 64), // 图标大小
                                    image: "images/vessel.png",// 大图地址
                                })
                            });

                            //PUT Variable to Process Engine Or Global cache
                            if ($scope.vState == 'arrival') {
                                //TODO : 修改StartTime
                                var ms = Date.parse($scope.pvars[$scope.pIdxs['StartTime']].value) + $scope.pvars[$scope.pIdxs['NowLoc']].value.timeStamp;
                                var d = new Date();
                                d.setTime(ms);
                                if (d != 'Invalid Date') {
                                    scope.pvars[$scope.pIdxs['StartTime']].value = $filter('date')(d, "yyyy-MM-dd HH:mm:ss");
                                }
                                //TODO：设置到港,完成任务
                                var varUrl = activityBasepath + '/zbq/variables/' + $scope.pid + '/complete';
                                $http.put(varUrl, $scope.pvars)
                                    .success(function (res) {
                                        console.log("Voyaging Task 结束，将startTime上传");
                                        $http.post(activityBasepath + '/zbq/tasks/Voyaging')
                                            .success(function (data) {
                                                $.toaster('到达港口!', 'Success', 'success');
                                                console.log("到达港口 ： ", $scope.pvars[$scope.pIdxs['PrePort']]['value']);
                                            });
                                    });
                            } else {
                                VesselProcessService.PutProcessVariables($scope.pid, $scope.pvars).then(function (resp) {
                                    // $.toaster('PUT once more','Vessel','info');
                                    // $.toaster('$scope.cnt : '+$scope.cnt,'Vessel','info');
                                    // console.log("PUT once more");
                                    // console.log('$scope.cnt : '+$scope.cnt);
                                    // console.log("cnt", $scope.cnt);
                                    var tCnt = $scope.cnt + 1;
                                    // console.log("Lng:", [$scope.vdata[$scope.cnt][1], $scope.vdata[$scope.cnt][2]]);
                                    $scope.delay = (Date.parse($scope.vdata[tCnt][3]) - Date.parse($scope.vdata[tCnt - 1][3])) / $scope.ZoomInVal;
                                    //if($scope.vState == 'voyaging'){
                                    $scope.cnt++;
                                    // }else if($scope.vState == 'arrival'){

                                    // }
                                });
                            }
                        }


                    }

                }, $scope.delay, 1);

            }
        });

        /**
         *监听船的状态 Voyaging/Anchoring-Docking State.
         * @type {{}}
         */
        $scope.$watch('vState', function (newState) {
            if (newState == 'arrival') {
                // 如果不是anchoring / docking状态就停止传送，而是侦听是否有新的voyaging状态出现
                $scope.ADTi = $interval(function () {
                    var promise1 = VesselProcessService.GetProcessVariablesById($scope.pid);
                    promise1.then(function (data) {  // 调用承诺API获取数据 .resolve
                        $scope.pvars = data;
                        $scope.pIdxs = VesselProcessService.FindVarIdxByName($scope.pvars);
                        // $.toaster("<-----暂停 ---->"+$scope.pvars[$scope.pIdxs['State']]['value'] == 'arrival','Vessel','warning');
                        // console.log("<-----暂停 ---->"+$scope.pvars[$scope.pIdxs['State']]['value'] == 'arrival');
                        //console.log(" State : "+$scope.pvars[$scope.pIdxs['State']].value);
                        // console.log($scope.pvars[0].name);
                        if ($scope.pvars[$scope.pIdxs['State']]['value'] == 'arrival') {
                            // $.toaster("船处于其他状态，anchoring /docking",'Vessel','warning');
                            console.log("船处于其他状态，anchoring /docking")
                        } else if ($scope.pvars[$scope.pIdxs['State']]['value'] == 'voyaging') {
                            // var temp=$scope.cnt+1;
                            // $scope.delay=(Date.parse($scope.vdata[temp][3]) - Date.parse($scope.vdata[$scope.cnt][3]))/ZoomInVal;
                            $scope.vState = 'voyaging';
                            $scope.delay = 0;
                            $scope.cnt++;
                            $interval.cancel($scope.ADTi);
                        }
                    });
                }, 1000);
            }
        });

        /**
         * apply spare parts :
         */
        $scope.apply_time = '1970-01-01';
        $scope.sp_name = '';
        $scope.apply = function () {
            $http.get(activityBasepath + '/zbq/variables/' + $scope.pid)
                .success(function (data) {
                    $scope.pvars = data;
                    $scope.pIdxs = VesselProcessService.FindVarIdxByName($scope.pvars);
                    var ms = Date.parse($scope.pvars[$scope.pIdxs['StartTime']].value) + $scope.pvars[$scope.pIdxs['NowLoc']].value.timeStamp;

                    var d = new Date();
                    d.setTime(ms);
                    if (d != 'Invalid Date') {
                        $scope.apply_time = $filter('date')(d, "yyyy-MM-dd HH:mm:ss");
                    }
                    var var_apply_time = {
                        'name': 'apply_time',
                        'type': 'date',
                        'scope': 'local',
                        'value': $scope.apply_time
                    };
                    var var_sp_name = {
                        'name': 'sp_name',
                        'type': 'string',
                        'scope': 'local',
                        'value': $scope.sp_name
                    };

                    $scope.pvars.push(var_apply_time, var_sp_name);
                    var varUrl = activityBasepath + '/zbq/variables/' + $scope.pid + '/complete';
                    $http.put(varUrl, $scope.pvars)
                        .success(function (data) {
                            console.log("Voyaging Task 结束，将startTime上传");
                            $scope.pvars = data;
                            $scope.pIdxs = VesselProcessService.FindVarIdxByName($scope.pvars);
                            var start_apply = new Date();
                            var data2VMC = {
                                'msgType' : "Msg_StartMana",
                                'Apply_Id': MapFactory.newGuid,
                                'V_pid': $scope.pid,
                                'V_id': $scope.V_id,
                                'V_ApplyTime':var_apply_time.value,
                                'V_ApplyTime_2':start_apply,
                                'V_TargLocList':$scope.pvars[$scope.pIdxs['TargLocList']]['value'],
                                'SparePartName':var_sp_name.value
                            };
                            $http.post(activityBasepath + "/coord/messages/Msg_StartVMC", data2VMC)
                                .success(function (data) {
                                    console.log("Send Message to VMC!", data);
                                })
                        });
                });
        };

        // $http.get(activityBasepath + '/runtime/process-instances/657608/variables')
        //     .success(function (data) {
        //         var varUrl = activityBasepath + '/zbq/variables/' + 657608 + '/complete';
        //         console.log("data:",data);
        //         $http.put(varUrl, data)
        //             .success(function (data) {
        //                 console.log("执行完毕！",data);
        //             })
        //
        //
        //     })

    });


