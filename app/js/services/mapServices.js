'use strict';
App.factory('MapFactory', function ($http) {
    // noinspection JSAnnotator
    return {
        setTraffic: function (pathSimplifierIns, searchTimeData, searchSpeedData, index) {
            const Min = 0;
            const Max = 10;
            let rand = Min + Math.round(Math.random() * (Max - Min));
            if (rand <= 6) {
                pathSimplifierIns.getRenderOptions().pathLineStyle.strokeStyle = 'green';
            } else if (rand <= 8) {
                searchTimeData[index] *= 2;
                searchSpeedData[index] /= 2;
                pathSimplifierIns.getRenderOptions().pathLineStyle.strokeStyle = 'yellow';

            } else {
                searchTimeData[index] *= 4;
                searchSpeedData[index] /= 4;
                pathSimplifierIns.getRenderOptions().pathLineStyle.strokeStyle = 'red';
            }
        },
        newGuid: function () {
            let guid = "";
            for (let i = 1; i <= 32; i++) {
                let n = Math.floor(Math.random() * 16.0).toString(16);
                guid += n;
                if ((i === 8) || (i === 12) || (i === 16) || (i === 20))
                    guid += "-";
            }
            console.log("GUID", guid);
            return guid;
        }, setManager: function (title, position) {
            console.log("setManager:", title, position);
            new AMap.Marker({
                map: map,
                icon: manager64,
                position: position,
                title: title
            });
        }, setSupplier: function (title, position) {
            console.log("setSupplier:", title, position);
            new AMap.Marker({
                map: map,
                icon: supplier64,
                position: position,
                title: title
            });
        }
    }
});
// let NavigationFlag = false;
let pathSimplifierIns = null;  //导航实例
let pathSimplifierIns4Route = null;
let map = null;  //地图实例
// let navg1 = null;  //巡航器实例

// let searchPathData = [];  //本次路径规划路段经纬度集合
// let searchDistanceData = [];    //本次路径规划路段距离集合，单位：米
// let searchTimeData = [];    //本次路径规划路段经时间集合，单位：秒
// let searchSpeedData = [];   //本次路径规划路段经速冻集合，单位：m/s（其中需要考虑换算因子）
//
// let estimatedTime = 0;  //本次路径规划的预计总时间，单位：秒
// let estimatedDistance = 0;  //本次路径规划的预计总时间，单位：米
// let originTime = 0;   // 车启动的起始时刻，yyyy-MM-dd hh:mm:ss
// let totalTime = 0; //车行驶过的路程话费时间
// let deadline = 0;  //时限
let remainingTime = 1000000; //时限的剩余时间
// let searchOrigin = {}; //车起经纬度
// let searchDestination = {}; //目的经纬度
// let expandPathFlag = true;  //路径扩展的标志
let driving = {};  //路径规划实例
let NavigationData = {}; //
// let NavigationEvent = {}; //
// let index = 0;

let port32 = null;  //使用中的港口，icon类
let uselessPort32 = null;   //未使用中的港口，icon类
let supplier64 = null;   //供货商，icon类
let manager64 = null;    //主管,icon类
let portMarkers = []; //港口点标记集合，Marker类集合

let vids = {};
let port = [];
let isRun = {};// key : pid , value : 流程实例是否已开始显示
let vInst = {};	// 流程实例
let vVariables = {};	// 流程实例关联的变量
let target = null;// 目标港口是第一个
let pVid = {};

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
                zoom: 5,
                center: ["114.52105", "30.6827"],
                //地图是否可通过键盘控制,默认为true
                keywordEnable: true
            });
            port32 = new AMap.Icon({
                image: "/images/port32.png",
                size: new AMap.Size(32, 32)
            });
            uselessPort32 = new AMap.Icon({
                image: "/images/useless-port32.png",
                size: new AMap.Size(32, 32)
            });
            supplier64 = new AMap.Icon({
                image: "/images/supplier64.png",
                size: new AMap.Size(64, 64)
            });
            manager64 = new AMap.Icon({
                image: "/images/manager64.png",
                size: new AMap.Size(64, 64)
            });
            // //TODO:船启动后，才添加港口
            // for (var i = 0; i < port_1.length; i++) {
            //     portMarkers.push(new AMap.Marker({
            //         map: map,
            //         icon: port32,
            //         position: new AMap.LngLat(port_1[i][1], port_1[i][2]),
            //         title: port_1[i][0]
            //     }));
            // }
            /*
            地点搜索.输入提示
            */
            AMap.plugin(['AMap.Autocomplete', 'AMap.PlaceSearch'], function () {
                var autoOptions_start = {
                    //城市，默认全国
                    city: "",
                    //可选参数，用来指定一个input输入框，设定之后，在input输入文字将自动生成下拉选择列表
                    input: "startPointSearch"
                };
                var autocomplete_start = new AMap.Autocomplete(autoOptions_start);
                var placeSearch_start = new AMap.PlaceSearch({
                    //兴趣点城市,默认全国
                    city: '',
                    //当指定此参数后，搜索结果的标注、线路等均会自动添加到此地图上。可选值
                    map: '',
                    //用于控制在搜索结束后，是否自动调整地图视野使绘制的Marker点都处于视口的可见范围
                    autoFitView: false,

                });
                AMap.event.addListener(autocomplete_start, "select", function (e) {
                    //adcode区域编码
                    placeSearch_start.setCity(e.poi.adcode);
                    placeSearch_start.search(e.poi.name, function (status, result) {
                        console.log("Manager!", result.poiList.pois[0].name, result.poiList.pois[0].location);
                        MapFactory.setManager(result.poiList.pois[0].name, result.poiList.pois[0].location);

                    });
                });


                var autoOptions_end = {
                    city: "",
                    input: "endPointSearch"
                };
                var autocomplete_end = new AMap.Autocomplete(autoOptions_end);
                var placeSearch_end = new AMap.PlaceSearch({
                    city: '',
                    map: '',
                    autoFitView: false,
                });
                AMap.event.addListener(autocomplete_end, "select", function (e) {
                    placeSearch_end.setCity(e.poi.adcode);
                    placeSearch_end.search(e.poi.name, function (status, result) {
                        console.log("Supplier!");
                        MapFactory.setSupplier(result.poiList.pois[0].name, result.poiList.pois[0].location);

                    });
                });
            });
            AMap.service(["AMap.Driving"], function () {
                var drivingOptions = {
                    //当指定此参数后，搜索结果的标注、线路等均会自动添加到此地图上。可选
                    map: map,
                    //结果列表的HTML容器id或容器元素，提供此参数后，结果列表将在此容器中进行展示。可选
                    // panel: 'panel',
                    //显示绿色代表畅通，黄色代表轻微拥堵，红色代表比较拥堵，灰色表示无路况信息。
                    showTraffic: false,
                    //将查询到的路径置于可视窗口
                    autoFitView: true,
                    //车牌省份的汉字缩写，用于判断是否限行，与number属性组合使用，可选。例如：京
                    province: '沪',
                    //除省份之外车牌的字母和数字，用于判断限行相关，与province属性组合使用，可选。例如:NH1N11
                    number: 'NH7085',
                    // hideMarkers: true,
                    //驾车策略:考虑实时路况;AMap.DrivingPolicy.LEAST_TIME 最快捷模式
                    policy: AMap.DrivingPolicy.LEAST_TIME,  //AMap.DrivingPolicy.REAL_TRAFFIC
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
                pathSimplifierIns4Route = new PathSimplifier({
                    //置顶选中的轨迹线；置顶的含义是，将该轨迹线的zIndex设置为现存最大值+1。默认true。
                    onTopWhenSelected: false,
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
                        onTopWhenSelected: true,
                        pathLineStyle: {
                            strokeStyle: 'blue',
                            lineWidth: 4,
                            dirArrowStyle: true
                        }
                    }
                });
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
                        onTopWhenSelected: true,
                        autoSetFitView: true,
                        pathLineStyle: {
                            strokeStyle: 'white',
                            lineWidth: 6,
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
            $.toaster({
                settings: {
                    toaster: {
                        css: {
                            top: '10%',
                            left: '5%'
                        }
                    },
                    toast: {
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
                    timeout: 5000
                }
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

        // this.doSearch = function (SearchOrigin, SearchDestination, line) {
        //     $.toaster('路径规划启动!', 'Info', 'info');
        //     deadline = line;
        //     driving.clear();
        //     driving.search(SearchOrigin, SearchDestination, function (status, result) {
        //         console.log("search开始", result);
        //         var date1 = new Date();
        //         searchOrigin = new AMap.LngLat(result.origin.getLng(), result.origin.getLat());
        //         searchDestination = new AMap.LngLat(result.destination.getLng(), result.destination.getLat());
        //         searchPathData = [];
        //         searchDistanceData = [];
        //         searchTimeData = [];
        //         searchSpeedData = [];
        //
        //         for (var i = 0; i < result.routes.length; i++) {
        //             for (var j = 0; j < result.routes[i].steps.length; j++) {
        //                 searchPathData.push(result.routes[i].steps[j].path.slice(0));
        //                 searchDistanceData.push(result.routes[i].steps[j].distance);
        //                 searchTimeData.push(result.routes[i].steps[j].time);
        //                 searchSpeedData.push(result.routes[i].steps[j].distance / result.routes[i].steps[j].time * 1000 / 3.6);
        //             }
        //         }
        //
        //         estimatedTime = result.routes[0].time;
        //         estimatedDistance = result.routes[0].distance;
        //         NavigationFlag = true;
        //         $.toaster('路径规划完成!', 'Success', 'success');
        //     });
        // };
        // this.doSearch = function (event,ZoomInVal) {
        //     let route = event.data.pathResult;
        //     console.log("route",route);
        //     searchOrigin = new AMap.LngLat(event.data.W_Info.x_Coor, event.data.W_Info.y_Coor);
        //     searchDestination = new AMap.LngLat(event.data.DestPort.x_coor, event.data.DestPort.y_coor);
        //     let path = route.paths[0];
        //     estimatedTime = path.duration;
        //     estimatedDistance = path.distance;
        //     searchPathData = [];
        //     searchDistanceData = [];
        //     searchTimeData = [];
        //     searchSpeedData = [];
        //
        //     let tempPathData = [];
        //     for (let i = 0; i < path.steps.length; i++) {
        //         tempPathData.push(path.steps[i].polyline);
        //         searchDistanceData.push(path.steps[i].distance);
        //         searchTimeData.push(path.steps[i].duration);
        //         searchSpeedData.push(path.steps[i].distance / path.steps[i].duration / 3.6 * ZoomInVal);
        //     }
        //     for (let i = 0; i < tempPathData.length; i++) {
        //         let tempString = tempPathData[i].split(';');
        //         searchPathData[i] = [];
        //         for (let j = 0; j < tempString.length; j++) {
        //             let temp = tempString[j].split(',');
        //             searchPathData[i].push(new AMap.LngLat(temp[0], temp[1]));
        //         }
        //     }
        //     console.log("searchPathData",searchPathData);
        // };
        // this.setPort = function (title, position) {
        //     new AMap.Marker({
        //         map: map,
        //         icon: port32,
        //         position: position,
        //         title: title
        //     });
        // };
        //
        //
        // this.setUselessPort = function (title, position) {
        //     new AMap.Marker({
        //         map: map,
        //         icon: uselessPort32,
        //         position: position,
        //         title: title
        //     });
        // };

        this.doNavigation = function (event, ZoomInVal) {
            //获取路径
            let route = event.data.pathResult;
            let path = route.paths[0];
            let tempPathData = [];
            let pathData = [];
            let searchPathData = [];
            let searchDistanceData = [];
            let searchTimeData = [];
            let searchSpeedData = [];
            let estimatedTime = path.duration;
            let estimatedDistance = path.distance;
            let gpTimer = null;
            let searchOrigin = new AMap.LngLat(event.data.W_Info.x_Coor, event.data.W_Info.y_Coor);
            let searchDestination = new AMap.LngLat(event.data.DestPort.x_coor, event.data.DestPort.y_coor);


            for (let i = 0; i < path.steps.length; i++) {
                tempPathData.push(path.steps[i].polyline);
                searchDistanceData.push(path.steps[i].distance);
                searchTimeData.push(path.steps[i].duration);
                searchSpeedData.push(path.steps[i].distance / path.steps[i].duration / 3.6 * ZoomInVal);
            }
            for (let i = 0; i < tempPathData.length; i++) {
                let tempString = tempPathData[i].split(';');
                searchPathData[i] = [];
                for (let j = 0; j < tempString.length; j++) {
                    let temp = tempString[j].split(',');
                    searchPathData[i].push(new AMap.LngLat(temp[0], temp[1]));
                    pathData.push(new AMap.LngLat(temp[0], temp[1]));
                }
            }
            console.log("pathData", pathData);

            //启动Navigation
            let index = 0;
            let totalTime = 0;
            let NavigationEvent = event;
            let expandPathFlag = true;
            $.toaster('车辆导航开始!', 'Info', 'info');
            pathSimplifierIns.clearPathNavigators();
            MapFactory.setTraffic(pathSimplifierIns, searchTimeData, searchSpeedData, index);
            pathSimplifierIns4Route.setData([{
                name: '总路线',
                path: pathData.slice(0)
            }]);
            NavigationData = [{
                name: '路段',
                path: searchPathData[index].slice(0)
            }];
            pathSimplifierIns.setData(NavigationData);
            //对第一条线路（即索引 0）创建一个巡航器
            let navg1 = pathSimplifierIns.createPathNavigator(0, {
                //循环播放
                loop: false,
            });
            navg1.setSpeed(searchSpeedData[index]);

            totalTime += searchTimeData[index];
            // searchRemainingTime -= searchTimeData[index];
            // remainingTime = deadline - totalTime;

            //flag是是否做路程扩展的判断标志
            let expandPath = function () {
                let doExpand = function () {
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
                        //     });
                        // $http.get(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info")
                        //     .success(function (data) {
                        //         console.log("data:", data);
                        //         data.value.isArrival = true;
                        //         $http.put(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info/complete", data)
                        //             .success(function (data) {
                        //                 $http.post(activityBasepath + "/zbq/tasks/Running")
                        //                     .success(function (data) {
                        //                         NavigationEvent = null;
                        //                         $.toaster('到达终点!', 'Success', 'success');
                        //                         console.log("到达终点！");
                        //                         expandPathFlag = false;
                        //                     });
                        //             });
                        //     });
                        return false;
                    }
                    MapFactory.setTraffic(pathSimplifierIns, searchTimeData, searchSpeedData, index);
                    pathSimplifierIns4Route.setData([{
                        name: '总路线',
                        path: pathData.slice(0)
                    }]);
                    NavigationData[0].path = searchPathData[index].slice(0);

                    pathSimplifierIns.setData(NavigationData);
                    // pathSimplifierIns.setSelectedPathIndex(1);
                    navg1 = pathSimplifierIns.createPathNavigator(0, {
                        loop: false,
                    });
                    navg1.setSpeed(searchSpeedData[index]);
                    navg1.start();
                    totalTime += searchTimeData[index];
                    // searchRemainingTime = searchRemainingTime - searchTimeData[index];
                    // remainingTime = deadline - totalTime;
                    return true;
                };

                if (navg1.getNaviStatus().toString() === 'pause' && navg1.isCursorAtPathEnd()) {
                    if (index + 1 <= searchPathData.length - 1 && remainingTime > 0) {
                        expandPathFlag = doExpand();
                    }

                    // else if (index + 1 <= searchPathData.length - 1 && remainingTime <= 0) {
                    //     $.toaster('时间不充足,需要重新规划路径!', 'Warning', 'warning');
                    //     console.log("时间不充足,需要重新规划路径！");
                    //     $interval.cancel(gpTimer);
                    //     searchOrigin = new AMap.LngLat(navg1.getPosition().getLng(), navg1.getPosition().getLat());
                    //     $http.get(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info")
                    //         .success(function (data) {
                    //             console.log("data:", data);
                    //             data.value.x_Coor = searchOrigin.getLng();
                    //             data.value.y_Coor = searchOrigin.getLat();
                    //             console.log("当前点坐标:" + data.value.x_Coor + ',' + data.value.y_Coor);
                    //             console.log("NavigationEvent:", NavigationEvent);
                    //             $http.put(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info/complete", data)
                    //                 .success(function (data) {
                    //                     $http.post(activityBasepath + "/zbq/tasks/Running")
                    //                         .success(function (data) {
                    //                             NavigationEvent = null;
                    //                             expandPathFlag = false;
                    //                             $.toaster('重新规划路径完毕', 'Success', 'success');
                    //                             console.log("重新规划路径完毕");
                    //                         });
                    //                 });
                    //         });
                    // }
                }
                if (expandPathFlag) {
                    setTimeout(expandPath, 1000);
                }

            };

            let getPosition = function () {
                let position = navg1.getPosition();
                console.log("NavigationEvent:", NavigationEvent);
                // $http.get(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info")
                //     .success(function (data) {
                //         data.value.x_Coor = position.getLng();
                //         data.value.y_Coor = position.getLat();
                //         // console.log(data.value.x_Coor + ',' + data.value.y_Coor);
                //         // $http.put(activityBasepath + '/zbq/variables/' + NavigationEvent.data.W_Info.pid + "/W_Info", data)
                //         //     .success(function (data) {
                //         //         console.log("put wagon W_Info", data);
                //         //     });
                //     });
                // $.toaster('[' + position.getLng() + ',' + position.getLat() + ']', '车辆当前经纬度', 'info');
            };
            navg1.start();
            gpTimer = $interval(function () {
                getPosition();
            }, 1000);
            expandPath();
        }
        ;

    }
);
