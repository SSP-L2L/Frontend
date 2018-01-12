'use strict';
App.factory('MapFactory', function ($http) {
    // noinspection JSAnnotator
    return {
        setDeadline: function (deadline) {
            // $("input[id='remainingTime']").val(deadline.toString());
            return remainingTime;
        },
        setPort : function (title, position) {
        new AMap.Marker({
            map: map,
            icon: port64,
            position: position,
            title: title
        });
    }
    }
});
var NavigationFlag=false;
var pathSimplifierIns = null;
var map=null;
var navg1 = null;
var searchPathData = [];
var searchDistanceData=[];
var searchTimeData=[];
var searchSpeedData=[];
var searchTrafficData=[];
var searchTrafficDataFlag=[];
var estimatedTime = 0;
var estimatedDistance = 0;
var totalTime = 0;
var deadline = 0;
var searchRemainingTime=0;
var remainingTime = 0;
var reSearchOrigin={};
var reSearchDestination={};
var expandPathFlag=null;
var driving = {};
var NavigationData = {};
var NavigationEvent={};
var index=0;

var port64 = null;  //使用中的港口，icon类
var uselessPort64 = null;   //未使用中的港口，icon类
var supplier64 = null;   //供货商，icon类
var manager64 = null;    //主管,icon类
var portMarkers = []; //港口点标记集合，Marker类集合

var vids = {};
var port = [];
var isRun = {};// key : pid , value : 流程实例是否已开始显示
var vInst = {};	// 流程实例
var vVariables = {};	// 流程实例关联的变量
var target = null;// 目标港口是第一个
var pVid = {};

App.service('MapService', function (MapFactory, $http, Session, VesselProcessService, $interval) {

    vids['413362260'] = data_1;// 船号-->位置信息
    port['413362260'] = port_1.slice(0);// 船号-->港口列表
    target = port_1[0];// 目标港口是第一个

    this.initMap = function () {
        /*
           加载Map
        */
        map = new AMap.Map("mapContainer", {
            //是否监控地图容器尺寸变化，默认值为false
            resizeEnable: true,
            //地图显示的缩放级别
            zoom: 7,
            center: ["114.52105", "30.6827"],
            //地图是否可通过键盘控制,默认为true
            keywordEnable: true
        });
        port64 = new AMap.Icon({
            image: "/images/port64.png",
            size: new AMap.Size(64, 64)
        });
        uselessPort64 = new AMap.Icon({
            image: "/images/useless-port64.png",
            size: new AMap.Size(64, 64)
        });
        supplier64 = new AMap.Icon({
            image: "/images/supplier64.png",
            size: new AMap.Size(64, 64)
        });
        manager64 = new AMap.Icon({
            image: "/images/msanager64.png",
            size: new AMap.Size(64, 64)
        });
        for (var i = 0; i < port_1.length; i++) {
            portMarkers.push(new AMap.Marker({
                map: map,
                icon: uselessPort64,
                position: new AMap.LngLat(port_1[i][1], port_1[i][2]),
                title: port_1[i][0]
            }));
        }
        AMap.service(["AMap.Driving"], function () {
            var drivingOptions = {
                //当指定此参数后，搜索结果的标注、线路等均会自动添加到此地图上。可选
                map: map,
                //结果列表的HTML容器id或容器元素，提供此参数后，结果列表将在此容器中进行展示。可选
                // panel: 'panel',
                //显示绿色代表畅通，黄色代表轻微拥堵，红色代表比较拥堵，灰色表示无路况信息。
                showTraffic: true,
                //将查询到的路径置于可视窗口
                autoFitView: true,
                //车牌省份的汉字缩写，用于判断是否限行，与number属性组合使用，可选。例如：京
                province: '沪',
                //除省份之外车牌的字母和数字，用于判断限行相关，与province属性组合使用，可选。例如:NH1N11
                number: 'NH7085',
                // hideMarkers: true,
                //驾车策略:考虑实时路况;AMap.DrivingPolicy.LEAST_TIME 最快捷模式
                policy: AMap.DrivingPolicy.REAL_TRAFFIC,  //AMap.DrivingPolicy.LEAST_TIME
                extensions: 'all'
            };
            driving = new AMap.Driving(drivingOptions);
        });
        /*
            路径展示
        */
        AMapUI.load(['ui/misc/PathSimplifier', 'lib/$'], function (PathSimplifier, $) {

            if (!PathSimplifier.supportCanvas) {
                alert('当前环境不支持 Canvas！');
                return;
            }
            pathSimplifierIns = new PathSimplifier({
                //置顶选中的轨迹线；置顶的含义是，将该轨迹线的zIndex设置为现存最大值+1。默认true。
                onTopWhenSelected: true,
                autoSetFitView: false,
                //所属的地图实例
                map: map,
                getPath: function (pathData, pathIndex) {
                    //返回轨迹数据中的节点坐标信息，[AMap.LngLat, AMap.LngLat...] 或者 [[lng|number,lat|number],...]
                    return pathData.path;
                },
                getHoverTitle: function (pathData, pathIndex, pointIndex) {
                    //返回鼠标悬停时显示的信息
                    if (pointIndex >= 0) {
                        //鼠标悬停在某个轨迹节点上
                        return pathData.name + '，点：' + pointIndex + '/' + pathData.path.length;
                    }
                    //鼠标悬停在节点之间的连线上
                    return pathData.name + '，点数量' + pathData.path.length;
                },
                renderOptions: {
                    //绘制路线节点，如不需要可设置为-1
                    renderAllPointsIfNumberBelow: -1,
                    autoSetFitView: true,
                    pathLineStyle: {
                        strokeStyle: 'white',
                        lineWidth: 4,
                        dirArrowStyle: true
                    },
                    pathNavigatorStyle: {
                        //巡航器形状宽度
                        width: 64,
                        //巡航器形状高度
                        height: 64,
                        autoRotate: false,
                        // content: 'defaultPathNavigator'
                        content: PathSimplifier.Render.Canvas.getImageContent('images/wagon64.png', function onload() {
                            //图片加载成功，重新绘制一次
                            pathSimplifierIns.renderLater();
                        }, function onerror(e) {
                            alert('图片加载失败！');
                        })
                    }
                }
            });
            window.pathSimplifierIns = pathSimplifierIns;
        });
        $.toaster('初始化成功！', 'Info', 'success');
    };


    this.setManager = function (title, position) {
        new AMap.Marker({
            map: map,
            icon: manager64,
            position: position,
            title: title
        });
    };


    this.setSupplier = function (title, position) {
        new AMap.Marker({
            map: map,
            icon: supplier64,
            position: position,
            title: title
        });
    };


    this.setPort = function (title, position) {
        new AMap.Marker({
            map: map,
            icon: port64,
            position: position,
            title: title
        });
    };


    this.setUselessPort = function (title, position) {
        new AMap.Marker({
            map: map,
            icon: uselessPort64,
            position: position,
            title: title
        });
    };


    this.doSearch = function (SearchOrigin, SearchDestination, deadline) {
        $.toaster('路径规划启动!', 'Info', 'info');
        remainingTime = MapFactory.setDeadline(this.deadline);
        driving.clear();
        driving.search(SearchOrigin, SearchDestination, function (status, result) {
            console.log("search开始");
            reSearchOrigin = new AMap.LngLat(result.origin.getLng(), result.origin.getLat());
            reSearchDestination = new AMap.LngLat(result.destination.getLng(), result.destination.getLat());

            $("input[id='this.reSearchOrigin']").val(reSearchOrigin.getLng().toString() + "," + reSearchOrigin.getLat().toString());
            $("input[id='this.reSearchDestination']").val(reSearchDestination.getLng().toString() + "," + reSearchDestination.getLat().toString());

            searchPathData=[];
            searchDistanceData =[];
            searchTimeData =[];
            searchSpeedData =[];
            searchTrafficData =[];

            for (var i = 0; i < result.routes.length; i++) {
                for (var j = 0; j < result.routes[i].steps.length; j++) {
                    searchPathData.push(result.routes[i].steps[j].path.slice(0));
                    searchDistanceData.push(result.routes[i].steps[j].distance);
                    searchTimeData.push(result.routes[i].steps[j].time);
                    searchSpeedData.push(result.routes[i].steps[j].distance / result.routes[i].steps[j].time * 24*60);
                    searchTrafficData.push(result.routes[i].steps[j].tmcs.slice(0));

                }
            }
            searchTrafficDataFlag=[];
            for (var k = 0; k < searchTrafficData.length; k++) {
                searchTrafficDataFlag.push(false);
                for (var m = 0; m < searchTrafficData[k].length; m++) {
                    if (searchTrafficData[k][m].status === '拥堵' || searchTrafficData[k][m].status === '严重拥堵') {
                        searchTrafficDataFlag[k] = true;
                        searchSpeedData[k] = searchSpeedData[k] / 2;
                    }
                }
            }
            // this.searchTrafficDataFlag[10] = true;
            estimatedTime = 0;
            estimatedDistance = 0;
            for (var i = 0; i < result.routes.length; i++) {
                estimatedTime = estimatedTime + result.routes[i].time;
                estimatedDistance = estimatedDistance + result.routes[i].distance;
            }
            searchRemainingTime = estimatedTime;
            $("input[id='this.estimatedTime']").val(estimatedTime.toString());

            // var revent = {};
            // revent.type = eventType.Msg_RWPlan;
            // //  revent.id = Session.generateId();
            // revent.data = {
            //     origin: [reSearchOrigin.getLng(), reSearchOrigin.getLat()],
            //     destination: [reSearchDestination.getLng(), reSearchDestination.getLat()],
            //     remainingTime: remainingTime,
            //     estimatedTime: estimatedTime,
            //     estimatedDistance: estimatedDistance
            // };
            // $http.post(activityBasepath + '/coord/message', revent)
            //     .success(function (data) {
            //         console.log("return result", data);
            //
            //     });
            NavigationFlag=true;
            // console.log(searchPathData);
            $.toaster('路径规划完成!', 'Success', 'success');
            console.log("search结束");
        });
    };


    this.doNavigation = function (event) {
        index=0;
        NavigationFlag=false;
        NavigationEvent=event;
        $.toaster('车辆导航开始!', 'Info', 'info');
        pathSimplifierIns.clearPathNavigators();
        // var sync4Search = true;
        // var sync4Expend = false;
        var gpTimer = null;
        totalTime = 0;
        NavigationData = [{
            name: '动态路线',
            path: searchPathData[index].slice(0)
        }];

        pathSimplifierIns.setData(NavigationData);
        //对第一条线路（即索引 0）创建一个巡航器
        navg1 = pathSimplifierIns.createPathNavigator(0, {
            //循环播放
            loop: false,
        });
        navg1.setSpeed(searchSpeedData[index]);
        totalTime = totalTime + searchTimeData[index];
        searchRemainingTime = searchRemainingTime - searchTimeData[index];
        remainingTime = deadline - totalTime;
        $("input[id='remainingTime']").val(remainingTime.toString());

        //flag是是否做路程扩展的判断标志
        expandPathFlag = true;

        var expandPath = function () {
            var doExpand = function () {
                // $.toaster('路径扩张开始!', 'Info', 'info');
                index++;

                if (index > searchPathData.length - 1) {
                    $interval.cancel(gpTimer);
                    //TODO：put修改isArrival
                    // $http.put(activityBasepath + '/zbq/variables' + NavigationEvent.data.W_Info.pid+ "/W_Info/complete", data)
                    //     .success(function (data) {
                    //         console.log("put wagon W_Info", data);
                    //         $http.post(activityBasepath+"/zbq/tasks/Running")
                    //             .success(function (data) {
                    //                 console.log("到达目的地，结束running");
                    //             });
                    //
                    //     });
                    $http.get(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info")
                        .success(function (data) {
                            console.log("data:",data);
                            data.value.isArrival = true;
                            $http.put(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info/complete", data)
                                .success(function (data) {
                                    $http.post(activityBasepath+"/zbq/tasks/Running")
                                        .success(function (data) {
                                            NavigationEvent=null;
                                            $.toaster('到达终点!', 'Success', 'success');
                                            console.log("到达终点！");
                                            expandPathFlag = false;
                                        });
                                });
                        });
                    return false;
                }
                NavigationData[0].path = searchPathData[index].slice(0);

                //延展路径
                pathSimplifierIns.setData(NavigationData);
                //重新建立一个巡航器
                navg1 = pathSimplifierIns.createPathNavigator(0, {
                    loop: false,
                });

                navg1.setSpeed(searchSpeedData[index]);
                navg1.start();

                totalTime += searchTimeData[index];
                searchRemainingTime = searchRemainingTime - searchTimeData[index];
                remainingTime = deadline - totalTime;
                $("input[id='remainingTime']").val(remainingTime.toString());
                // $.toaster('路径扩张完成!', 'Success', 'success');
                return true;
            };

            if (navg1.getNaviStatus().toString() === 'pause' && navg1.isCursorAtPathEnd()) {
                if (index + 1 <= searchPathData.length - 1 && !searchTrafficDataFlag[index + 1]) {
                    expandPathFlag = doExpand();
                }
                /*
                //TODO 总结：回调函数导致的函数顺序执行结构混乱，用双setTimeout保持三者顺序执行
                 */
                else if (index + 1 <= searchPathData.length - 1 && searchTrafficDataFlag[index + 1]) {
                    $.toaster('前方路段堵车!', 'Warning', 'warning');
                    console.log("前方路段堵车！");
                    $interval.cancel(gpTimer);
                    reSearchOrigin = new AMap.LngLat(navg1.getPosition().getLng(), navg1.getPosition().getLat());
                    $http.get(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info")
                        .success(function (data) {
                            console.log("data:",data);
                            data.value.x_Coor = reSearchOrigin.getLng();
                            data.value.y_Coor = reSearchOrigin.getLat();
                            console.log("当前点坐标:" + data.value.x_Coor + ',' + data.value.y_Coor);
                            console.log("NavigationEvent:",NavigationEvent);
                            $http.put(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info/complete", data)
                                .success(function (data) {
                                    $http.post(activityBasepath+"/zbq/tasks/Running")
                                        .success(function (data) {
                                            NavigationEvent=null;
                                            expandPathFlag = false;
                                            $.toaster('堵车情况汇报完毕!', 'Success', 'success');
                                            console.log("堵车，结束running");
                                        });
                                });
                        });
                }
            }
            if (expandPathFlag) {
                setTimeout(expandPath, 1000);
            }

        };

        var getPosition = function () {
            var position = navg1.getPosition();
            console.log("NavigationEvent:",NavigationEvent);
            $http.get(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info")
                .success(function (data) {
                    data.value.x_Coor = position.getLng();
                    data.value.y_Coor = position.getLat();
                    console.log(data.value.x_Coor + ',' + data.value.y_Coor);
                    // VesselProcessService.PutProcessVariable(NavigationEvent.data.W_Info.pid, "W_Info", data);
                    $http.put(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info", data)
                        .success(function (data) {
                            console.log("put wagon W_Info", data);
                        });
                });
            $.toaster('[' + position.getLng() + ',' + position.getLat() + ']', '车辆当前经纬度', 'info');
        };
        navg1.start();
        gpTimer = $interval(function () {
            getPosition();
        }, 1000);
        expandPath();
    };

});
