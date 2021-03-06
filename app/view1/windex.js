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
        $scope.wInst = undefined;
        $scope.vVariables = undefined;
        $scope.dockingTime = 5;
        $scope.wagonMarker = null;
        //Voyaging
        $scope.delay = -1;
        $scope.vti = {};
        $scope.portIdx = {};
        $scope.cnt = -1;
        $scope.ports = {};
        $scope.pvars = {};
        $scope.pIdxs = {};
        $scope.marker = {};
        $scope.vState = {};
        $scope.pid = {};
        $scope.ADTi = {};
        $scope.isMissOrMeet = false;
        $scope.W_pid = 0;
        $scope.isFirst = true; //判断是否是第一次规划
        $scope.currentCost = '0.00';  //当前成本
        $scope.initialCost = '0.00'; //初始成本
        $scope.passCost = 0;  //累计花费的成本
        $scope.carryRate = 0; //运费费率
        $scope.finalCost = 0; //最后一次路程的总成本
        $scope.portName = '';//上次路径的目的地港口名
        $scope.C1 = 0; //重新规划的港口列表中上次目标港口的总成本+累计花费的成本
        $scope.C2 = 0; //重新规划的港口列表中当前目标港口的总成本+累计花费的成本
        $scope.C1C0 = '';
        $scope.C2C0 = '';
        $scope.C2C1 = '';
        $scope.event = '';
        $scope.sp_weight = 0;
        let costRatePanelShow = {};
        let costRatePanelHide = {};
        if (Session.getEventId() === null) {
            Session.createEventId();
        }
        MapService.initMap();
        // 入口 ：
        // 侦听流程实例，获取启动vessel-process Instances 的船号等信息
        let params = {
            params: {
                processDefinitionKey: 'process_pool4'

            }
        };
        let promise = VesselProcessService.GetProcessInstance(params);
        promise.then(function (data) {  // 调用承诺API获取数据 .resolve
            console.log("promise : success ");
            if (data.size !== 0) {
                console.log("监听到车流程实例");
                $scope.wInst = data.data[0];
                console.log("$scope.wInst : " + $scope.wInst['id']);
                let pid = data.data[0].id;
                console.log(pid);
                let promise1 = VesselProcessService.GetProcessVariablesById(pid);
                promise1.then(function (data) {  // 调用承诺API获取数据 .resolve
                    console.log("promise : success ");
                    $scope.wVariables = data;
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

        let eventPromise = $interval(function () {
            $http.get(activityBasepath + '/sevents')
                .success(function (data) {
                    // console.log(data);
                    if (data.length > 0) {
                        data.sort(function sortNumber(a, b) {
                            return a.id - b.id;
                        });
                        for (let i = 0; i < data.length; i++) {
                            let event = data[i];
                            if ('W_RUN' === event.type) {
                                console.log("W_RUN.pid", event.data);
                                if (event.data.State === 'success') {
                                    $scope.sp_weight = event.data.sp_weight;
                                    $scope.W_START_Handle(event);
                                } else if (event.data.State === 'fail') {
                                    console.log("fail", event.data);
                                    if ($scope.isFirst === true) {
                                        $scope.initialCost = '∞';
                                        $scope.isFirst = false;
                                    } else {
                                        $scope.C1 = '∞';
                                        $scope.C2 = '∞';
                                        $('#C1C0').css({color: "black"});
                                        $('#C2C0').css({color: "black"});
                                        $('#C2C1').css({color: "black"});
                                        $scope.event = '当前变化无配送机会';
                                        if ($scope.initialCost === '∞') {
                                            $scope.C1C0 = '无配送机会';
                                            $scope.C2C0 = '无配送机会';
                                            $scope.C2C1 = '无配送机会';
                                        } else {
                                            $scope.C1C0 = '失去送机会';
                                            $scope.C2C0 = '失去送机会';
                                            $scope.C2C1 = '无配送机会';
                                        }
                                        costRatePanelShow = $interval(function () {
                                            $('#costRatePanel').show();
                                        }, 500, 1);
                                        // costRatePanelHide = $interval(function () {
                                        //     $('#costRatePanel').hide();
                                        // }, 20000, 1);
                                    }
                                    if (gpTimer !== null) {
                                        $interval.cancel(gpTimer);
                                    }
                                    pathSimplifierIns.clearPathNavigators();
                                    pathSimplifierIns.setData();
                                    pathSimplifierIns4Route.clearPathNavigators();
                                    pathSimplifierIns4Route.setData();
                                    if ($scope.wagonMarker !== null) {
                                        $scope.wagonMarker.hide();
                                    }
                                    $scope.wagonMarker = new AMap.Marker({
                                        map: map,
                                        icon: new AMap.Icon({
                                            image: "/images/wagon64.png",
                                            size: new AMap.Size(64, 64)
                                        }),
                                        position: new AMap.LngLat(event.data.W_Info.value.x_Coor, event.data.W_Info.value.y_Coor),
                                        title: 'wagon'
                                    });
                                    // let isArriving = {
                                    //     name : "isArriving",
                                    //     type: 'boolean',
                                    //     value: true,
                                    //     scope: 'local'
                                    // };
                                    // $http.put(activityBasepath + '/zbq/variables/' + event.data.W_Info.value.pid + "/isArriving/complete", isArriving)
                                    //     .success(function (data) {
                                    //         $http.post(activityBasepath + '/zbq/tasks/Running')
                                    //             .success(function(data){
                                    //                 console.log("Running 结束！");
                                    //             })
                                    //     });
                                    $.toaster('无法找到合适港口!', 'Admin', 'warning')
                                } else if (event.data.State === 'Missing') {
                                    $interval.cancel(setCurrentCost);
                                    $scope.C1 = '∞';
                                    $scope.C2 = '∞';
                                    $('#C1C0').css({color: "black"});
                                    $('#C2C0').css({color: "black"});
                                    $('#C2C1').css({color: "black"});
                                    $scope.event = '此次配送失败';
                                    if ($scope.initialCost === '∞') {
                                        $scope.C1C0 = '无配送机会';
                                        $scope.C2C0 = '无配送机会';
                                        $scope.C2C1 = '无配送机会';
                                    } else {
                                        $scope.C1C0 = '失去送机会';
                                        $scope.C2C0 = '失去送机会';
                                        $scope.C2C1 = '无配送机会';
                                    }
                                    costRatePanelShow = $interval(function () {
                                        $('#costRatePanel').show();
                                    }, 500, 1);
                                    // costRatePanelHide = $interval(function () {
                                    //     $('#costRatePanel').hide();
                                    // }, 20000, 1);
                                    if ($scope.wagonMarker !== null) {
                                        $scope.wagonMarker.hide();
                                    }
                                    // console.log("navi1Posion:",navg1Posion.getLng(),navg1Posion.getLat());
                                    // $scope.wagonMarker = new AMap.Marker({
                                    //     map: map,
                                    //     icon: new AMap.Icon({
                                    //         image: "/images/wagon64.png",
                                    //         size: new AMap.Size(64, 64)
                                    //     }),
                                    //     position: new AMap.LngLat(navg1Posion.getLng(), navg1Posion.getLat()),
                                    //     title: 'wagon'
                                    // });
                                    if (gpTimer !== null) {
                                        $interval.cancel(gpTimer);
                                    }
                                    pathSimplifierIns.clearPathNavigators();
                                    pathSimplifierIns.setData();
                                    pathSimplifierIns4Route.clearPathNavigators();
                                    pathSimplifierIns4Route.setData();
                                    //修改vState
                                    $scope.isMissOrMeet = true;
                                    $scope.vState = "voyaging";
                                    $scope.pvars[$scope.pIdxs['State']]['value'] = $scope.vState;
                                    $scope.delay = 0;
                                    $scope.cnt++;
                                    $.toaster('此次交易配送失败!', 'Missing', 'warning');
                                    // let isArriving = {
                                    //     name : "isArriving",
                                    //     type: 'boolean',
                                    //     value: true,
                                    //     scope: 'local'
                                    // };
                                    // $http.put(activityBasepath + '/zbq/variables/' + event.data.W_Info.value.pid + "/isArriving/complete", isArriving)
                                    //     .success(function (data) {
                                    //         $http.post(activityBasepath + '/zbq/tasks/Running')
                                    //             .success(function(data){
                                    //                 console.log("Running 结束！");
                                    //             })
                                    //     });
                                } else if (event.data.State === 'Meeting') {
                                    $interval.cancel(setCurrentCost);
                                    $scope.isMissOrMeet = true;
                                    $scope.vState = 'voyaging';
                                    $scope.delay = 0;
                                    $scope.pvars[$scope.pIdxs['State']]['value'] = $scope.vState;
                                    console.log("meeting state!", $scope.cnt);
                                    $scope.cnt++;
                                    console.log("meeting state!", $scope.cnt);
                                    // $scope.currentCost = ($scope.finalCost + parseInt($scope.currentCost) - passDistanceData * $scope.carryRate * $scope.sp_weight).toFixed(2);
                                    // console.log("原currentCost的值",$scope.currentCost);
                                    $scope.currentCost = ($scope.finalCost + $scope.passCost).toFixed(2);
                                    // console.log("finalCostANDpassCost",$scope.finalCost,$scope.passCost);
                                    // console.log("C2的值：",$scope.C2);
                                    $scope.event = '此次配送成功';
                                    costRatePanelShow = $interval(function () {
                                        $('#costRatePanel').show();
                                    }, 500, 1);
                                    $.toaster('车船相遇，完成交货!', 'Admin', 'success')
                                } else {
                                    console.log("other  state!");
                                }
                            }
                            if ('MSC_MeetWeightCond' === event.type) {
                                $scope.MSC_MeetWeightCond_Handle(event);
                            }
                        }
                    }
                });
        }, 500);
        $scope.W_START_Handle = function (event) {
            if ($scope.isFirst === true) {
                $scope.initialCost = (event.data.wDestPort.supCost).toFixed(2);
                $scope.portName = event.data.wDestPort.pname;
                $scope.carryRate = event.data.wDestPort.carryRate;
                $scope.isFirst = false;
            } else {
                $scope.passCost += passDistanceData * $scope.carryRate * $scope.sp_weight;
                console.log("已经消耗的路费：", $scope.passCost);
                if ($scope.portName === '') {
                    $scope.C1 = '∞';
                    $('#C1C0').css({color: "black"});
                    $('#C2C1').css({color: "black"});
                    $('#C2C0').css({color: "black"});
                    $scope.C1C0 = '无配送机会';
                    $scope.C2C1 = '抓住配送机会';
                    $scope.C2C0 = '抓住配送机会';
                    // $scope.event = '由不可配送变为可配送'
                } else {
                    $scope.C2 = $scope.passCost + event.data.wDestPort.supCost;
                    // console.log("C2/C0中C2,passCost,supCost",$scope.C2,$scope.passCost,event.data.wDestPort.supCost);
                    // $scope.event = '产生变化,改变目标港口';
                    for (let i = 0; i < event.data.W_TargPortList.length; i++) {
                        if (event.data.W_TargPortList[i].pname === $scope.portName) {
                            $scope.C1 = $scope.passCost + event.data.W_TargPortList[i].supCost;
                            if (initialCost === '∞') {
                                $('#C1C0').css({color: "black"});
                                $('#C2C0').css({color: "black"});
                                $scope.C1C0 = '抓住配送机会';
                                $scope.C2C0 = '抓住配送机会';
                            } else {
                                $scope.C1C0 = ((1 - ($scope.C1 / $scope.initialCost)) * 100).toFixed(2);
                                if ($scope.C1C0 < 0) {
                                    $('#C1C0').css({color: "red"});
                                    $scope.C1C0 = '↑' + (-$scope.C1C0) + '%';
                                } else {
                                    $('#C1C0').css({color: "green"});
                                    $scope.C1C0 = '↓' + $scope.C1C0 + '%';
                                }
                                $scope.C2C0 = ((1 - ($scope.C2 / $scope.initialCost)) * 100).toFixed(2);
                                if ($scope.C2C0 < 0) {
                                    $('#C2C0').css({color: "red"});
                                    $scope.C2C0 = '↑' + (-$scope.C2C0) + '%';
                                } else {
                                    $('#C2C0').css({color: "green"});
                                    $scope.C2C0 = '↓' + $scope.C2C0 + '%';
                                }
                            }
                            $scope.C2C1 = ((1 - ($scope.C2 / $scope.C1)) * 100).toFixed(2);
                            if ($scope.C2C1 < 0) {
                                $('#C2C1').css({color: "red"});
                                $scope.C2C1 = '↑' + (-$scope.C2C1) + '%';
                            } else {
                                $('#C2C1').css({color: "green"});
                                $scope.C2C1 = '↓' + $scope.C2C1 + '%';
                            }
                            break;
                        }
                        if (i === (event.data.W_TargPortList.length - 1)) {
                            $scope.C1 = '∞';
                            if (initialCost === '∞') {
                                $('#C2C0').css({color: "black"});
                                $('#C1C0').css({color: "black"});
                                $scope.C1C0 = '无配送机会';
                                $scope.C2C0 = '抓住配送机会';
                            } else {
                                $('#C1C0').css({color: "black"});
                                $scope.C1C0 = '失去配送机会';
                                $scope.C2C0 = ((1-($scope.C2 / $scope.initialCost))*100).toFixed(2);
                                if ($scope.C2C0 < 0) {
                                    $('#C2C0').css({color: "red"});
                                    $scope.C2C0 = '↑' + (-$scope.C2C0) + '%';
                                } else {
                                    $('#C2C0').css({color: "green"});
                                    $scope.C2C0 = '↓' + $scope.C2C0 + '%';
                                }
                            }
                            $('#C2C1').css({color: "black"});
                            $scope.C2C1 = '抓住配送机会';
                        }
                    }
                }
                costRatePanelShow = $interval(function () {
                    $('#costRatePanel').show();
                }, 500, 1);
                // costRatePanelHide = $interval(function () {
                //     $('#costRatePanel').hide();
                // }, 20000, 1);
                $scope.portName = event.data.wDestPort.pname;
                $scope.carryRate = event.data.wDestPort.carryRate;
            }
            $scope.finalCost = event.data.wDestPort.supCost;

            if ($scope.wagonMarker !== null) {
                $scope.wagonMarker.hide();
            }
            $.toaster(event.data.Reason, 'Vessel', 'info');
            $scope.event=event.data.Reason;
            MapService.doNavigation(event, ZoomInVal, $scope.wagonMarker);
        };
        let setCurrentCost = $interval(function () {
            $scope.currentCost = ($scope.passCost + passDistanceData * $scope.carryRate * $scope.sp_weight).toFixed(2);
            // console.log("当前路费:", $scope.currentCost);
        }, 500);
        /**
         * 根据限重，更换港口地址
         * @param event
         * @constructor
         */
        $scope.MSC_MeetWeightCond_Handle = function (event) {
            let portsList = event.data.MSC_TargPorts;
            for (let i = 0; i < portsList.length; i++) {
                if (!portsList[i].isMeetWeightCond) {
                    for (let j = 0; j < portMarkers.length; j++) {
                        if (portMarkers[j].getTitle() === portsList[i].pname) {
                            // console.log('更换港口图标！');
                            portMarkers[j] = new AMap.Marker({ // 加点
                                map: map,
                                position: [portsList[i].x_coor, portsList[i].y_coor],
                                icon: uselessPort32,
                                title: portsList[i].pname
                            });
                        }
                    }
                }
            }
            $.toaster("货物不符合部分港口的限重！", 'Vessel', 'warning');
        };
        $scope.startVessel = function () {
            let param = {
                params: {
                    name: 'Vessel'
                }
            };
            $http.get(activityBasepath + "/repository/process-definitions", param)
                .success(function (data) {
                    let pdArray = data.data;
                    let curPd = pdArray[pdArray.length - 1];
                    let processData = {
                        processDefinitionId: curPd.id,
                        name: 'Vessel',
                        values: {
                            sailor: $scope.sailor,
                            V_id: $scope.V_id
                        }
                    };
                    $http.post(activityBasepath + "/rest/process-instances", processData)
                        .success(function (data) {
                            let pid = data.id;
                            VesselProcessService.GetProcessVariablesById(pid)
                                .then(function (data) {
                                    $scope.voyaging(pid, $scope.V_id, data);
                                });
                        });

                });
        };

        /**
         * Voyaging
         * @param pid
         * @param nowVid
         * @param vars
         */
        $scope.voyaging = function (pid, nowVid, vars) {
            // 定位模块
            $scope.vdata = vids[nowVid]; // 船的数据
            $scope.len = $scope.vdata.length;
            $scope.ports = port[nowVid];// 港口数据
            $scope.portIdx = 0;
            $scope.pvars = vars;
            $scope.pid = pid;

            $scope.marker = new AMap.Marker({ // 加点
                map: map,
                position: [$scope.vdata[0][1], $scope.vdata[0][2]]
            });
            //TODO:船启动后，才添加港口
            for (let i = 0; i < port_1.length; i++) {
                portMarkers.push(new AMap.Marker({
                    map: map,
                    icon: port32,
                    position: new AMap.LngLat(port_1[i][1], port_1[i][2]),
                    title: port_1[i][0]
                }));
            }
            /*
             * 初始化船的一些信息
             */
            $scope.pIdxs = VesselProcessService.FindVarIdxByName($scope.pvars);
            //初始化TargLocList
            for (let i in  $scope.ports) {
                let ms = Date.parse($scope.pvars[$scope.pIdxs['StartTime']].value) + Date.parse($scope.ports[i][3]) - Date.parse($scope.vdata[0][3]);
                //加上默认等待时间
                ms += i * $scope.dockingTime * 60 * 60 * 1000;
                let d = new Date();
                d.setTime(ms);
                let e_date = '';
                let s_date = '';
                if (d !== 'Invalid Date') {
                    s_date = $filter('date')(d, "yyyy-MM-dd HH:mm:ss");
                    d.setTime(ms + $scope.dockingTime * 60 * 60 * 1000);
                    e_date = $filter('date')(d, "yyyy-MM-dd HH:mm:ss");
                }
                $scope.pvars[$scope.pIdxs['TargLocList']].value[i].estart = s_date;
                $scope.pvars[$scope.pIdxs['TargLocList']].value[i].eend = e_date;

            }

            $.extend(true, $scope.pvars[$scope.pIdxs['PrePort']]['value'], {
                'pname': '起点',
                'x_coor': $scope.vdata[0][1],
                'y_coor': $scope.vdata[0][2],
            });
            $scope.pvars[$scope.pIdxs['NextPort']]['value'] = $scope.pvars[$scope.pIdxs['TargLocList']].value[0];
            // 开始航行 , 间歇式传送数据到流程引擎
            $scope.delay = 0;
            console.log("VStart:", new Date());
            $scope.cnt = 0; // 循环次数
            $.toaster("船开始航行，下一站:" + $scope.pvars[$scope.pIdxs['NextPort']]['value'].pname, 'Vessel', 'success');

        };

        $scope.$watch('cnt', function (newCnt) {
            // console.log("after miss or meet : " , $scope.cnt);
            if ($scope.cnt !== -1) {
                $scope.vti = $interval(function () {
                    if ($scope.isMissOrMeet === false) {
                        $scope.vState = $scope.pvars[$scope.pIdxs['State']]['value'];
                    }
                    if ($scope.vState === 'voyaging') {// 进入voyaging 就开始PUT
                        // ，初始时流程启动，就开始PUT
                        // 上传流程变量
                        // 判断是否到达next_port;
                        if ($scope.isMissOrMeet === false) {
                            if ($scope.vdata[$scope.cnt][1] === $scope.ports[$scope.portIdx][1] && $scope.vdata[$scope.cnt][2] === $scope.ports[$scope.portIdx][2]) {
                                // $.toaster('<---------到达港口--------->', 'Vessel', 'success');
                                console.log("<---------到达港口--------->", new Date());
                                if ($scope.portIdx < $scope.ports.length) {
                                    $scope.pvars[$scope.pIdxs['PrePort']]['value'] = $scope.pvars[$scope.pIdxs['TargLocList']].value[$scope.portIdx];
                                    if ($scope.portIdx < $scope.ports.length - 1) {
                                        $scope.pvars[$scope.pIdxs['NextPort']]['value'] = $scope.pvars[$scope.pIdxs['TargLocList']].value[$scope.portIdx + 1];
                                    }
                                }
                                $scope.portIdx++;
                                // 到了港口，就设置 船进入其他状态

                                $scope.pvars[$scope.pIdxs['State']]['value'] = 'arrival';
                                $scope.vState = 'arrival';
                                $.toaster('到达' + $scope.pvars[$scope.pIdxs['PrePort']]['value'].pname + '港口；预计' + $scope.pvars[$scope.pIdxs['PrePort']]['value'].eend + '离港', 'Vessel', 'success');
                            }
                        }
                        // 修改流程变量---Now_loc
                        $.extend(true, $scope.pvars[$scope.pIdxs['NowLoc']].value, {
                            'lname': null,
                            'x_coor': $scope.vdata[$scope.cnt][1],
                            'y_coor': $scope.vdata[$scope.cnt][2],
                            'velocity': $scope.vdata[$scope.cnt][4]
                        });
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
                            if ($scope.vState === 'arrival') {
                                //TODO：设置到港,完成任务
                                let varUrl = activityBasepath + '/zbq/variables/' + $scope.pid + '/complete';
                                let upVars = [];
                                upVars.push($scope.pvars[$scope.pIdxs['NowLoc']], $scope.pvars[$scope.pIdxs['PrePort']], $scope.pvars[$scope.pIdxs['NextPort']], $scope.pvars[$scope.pIdxs['State']], $scope.pvars[$scope.pIdxs['TargLocList']]);
                                $http.put(varUrl, $scope.pvars)
                                    .success(function (res) {
                                        console.log("Voyaging Task 结束，将startTime上传");
                                    });
                            } else {
                                let upVars = [];
                                upVars.push($scope.pvars[$scope.pIdxs['NowLoc']], $scope.pvars[$scope.pIdxs['TargLocList']]);
                                VesselProcessService.PutProcessVariables($scope.pid, upVars).then(function (resp) {
                                    // console.log("voyaging",resp);
                                });
                                let tCnt = $scope.cnt + 1;
                                $scope.delay = (Date.parse($scope.vdata[tCnt][3]) - Date.parse($scope.vdata[tCnt - 1][3])) / ZoomInVal;
                                $scope.cnt++;
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
            if (newState === 'arrival') {
                // 如果不是anchoring / docking状态就停止传送，而是侦听是否有新的voyaging状态出现
                $scope.ADTi = $interval(function () {
                    let promise1 = VesselProcessService.GetProcessVariablesById($scope.pid);
                    promise1.then(function (data) {  // 调用承诺API获取数据 .resolve
                        $scope.pvars = data;
                        $scope.pIdxs = VesselProcessService.FindVarIdxByName($scope.pvars);
                        // console.log("<-----暂停 ---->" , $scope.pvars[$scope.pIdxs['State']]['value'] === 'arrival');
                        if ($scope.pvars[$scope.pIdxs['State']]['value'] === 'arrival') {
                            // console.log("船处于其他状态，anchoring /docking")
                        } else if ($scope.pvars[$scope.pIdxs['State']]['value'] === 'voyaging') {
                            // console.log("$scope.vdata[$scope.cnt][0]:", $scope.ports[$scope.portIdx - 1][0]);
                            for (let i = 0; i < portMarkers.length; i++) {
                                if (portMarkers[i].getTitle() === $scope.ports[$scope.portIdx - 1][0]) {
                                    portMarkers[i] = new AMap.Marker({ // 加点
                                        map: map,
                                        position: [$scope.ports[$scope.portIdx - 1][1], $scope.ports[$scope.portIdx - 1][2]],
                                        icon: uselessPort32,
                                        title: $scope.ports[$scope.portIdx - 1][0]
                                    });
                                }
                            }
                            $.toaster('船离港开始航行，下一站' + $scope.pvars[$scope.pIdxs['NextPort']]['value'].pname, 'Vessel', 'success');
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
        $scope.apply_time = '1970-01-01 00:00:00';
        $scope.sp_name = '缸盖';
        $scope.apply = function () {
            console.log("sp_name", $scope.sp_name);
            $http.get(activityBasepath + '/zbq/variables/' + $scope.pid)
                .success(function (data) {
                    $scope.pvars = data;
                    $scope.pIdxs = VesselProcessService.FindVarIdxByName($scope.pvars);
                    console.log($scope.pvars);
                    let d = new Date();
                    let ms = (d.getTime() - Date.parse($scope.pvars[$scope.pIdxs['StartTime']].value)) * ZoomInVal + Date.parse($scope.pvars[$scope.pIdxs['StartTime']].value);
                    d.setTime(ms);
                    if (d !== 'Invalid Date') {
                        $scope.apply_time = $filter('date')(d, "yyyy-MM-dd HH:mm:ss");
                    }
                    let var_apply_time = {
                        'name': 'apply_time',
                        'type': 'date',
                        'scope': 'local',
                        'value': $scope.apply_time
                    };
                    let var_sp_name = {
                        'name': 'sp_name',
                        'type': 'string',
                        'scope': 'local',
                        'value': $scope.sp_name
                    };

                    $scope.pvars.push(var_apply_time, var_sp_name);
                    let varUrl = activityBasepath + '/zbq/variables/' + $scope.pid + '/complete';
                    console.log("apply_pvars:", $scope.pvars);
                    $http.put(varUrl, $scope.pvars)
                        .success(function (data) {
                            console.log("Voyaging Task 结束，将startTime上传");
                            $scope.pvars = data;
                            $scope.pIdxs = VesselProcessService.FindVarIdxByName($scope.pvars);
                            let data2VMC = {
                                'msgType': "Msg_StartMana",
                                'Apply_Id': MapFactory.newGuid,
                                'V_pid': $scope.pid,
                                'V_id': $scope.V_id,
                                'V_ApplyTime': var_apply_time.value,
                                'V_TargLocList': $scope.pvars[$scope.pIdxs['TargLocList']]['value'],
                                'SparePartName': var_sp_name.value
                            };
                            console.log(" data2VMC : ", data2VMC);
                            $http.post(activityBasepath + "/coord/messages/Msg_StartVMC", data2VMC)
                                .success(function (data) {
                                    console.log("Send Message to VMC!");
                                });
                        });
                    $.toaster('提出申请，货物名为:' + $scope.sp_name, 'Admin', 'success');

                });
        };
    });


