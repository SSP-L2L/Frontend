App.factory('MapFactory', function ($http) {
    // noinspection JSAnnotator
    return {
        setDeadline: function () {
            var remainingTime = $("input[id='deadline']").val();
            $("input[id='remainingTime']").val(remainingTime.toString());
            return remainingTime;
        }, judgementTime: function (remainingTime, estimatedTime) {
            if (remainingTime >= estimatedTime) {
                return true;
                // doNavigation();
            } else {
                // alert("This is impossible，Sir.")
                return false;
            }
        }
    }
});

App.service('MapService', function (MapFactory) {
    this.searchPathData = [];
    //路径距离（每段路段的长度）
    this.searchDistanceData = [];
    //路径预计时间（每段路段的预计时间)
    this.searchTimeData = [];
    //路径速度（用上述做除法得到的每段路段的速度）
    this.searchSpeedData = [];

    this.searchTrafficData = [];

    this.searchTrafficDataFlag = [];
    //当前路径预计时间
    this.estimatedTime = 0;

    // this.estimatedDistance = 0;

    //累计时间
    this.totalTime = 0;
    //截止时间
    this.deadline = 0;
    //路径剩余时间
    this.searchRemainingTime = 0;
    //剩余时间
    this.remainingTime = 0;

    this.reSearchOrigin = undefined;
    this.reSearchDestination = undefined;

    this.expandPathFlag = true;

    this.map = undefined;
    this.driving = undefined;
    this.pathSimplifierIns = undefined;

    this.count = 0;

    this.index = 0;
    this.data = undefined;
    this.navg1 = undefined;

    this.initMap = function () {
        /*
           加载Map
        */
        map = new AMap.Map("mapContainer", {
            //是否监控地图容器尺寸变化，默认值为false
            resizeEnable: true,
            //地图显示的缩放级别
            zoom: 13,
            //地图是否可通过键盘控制,默认为true
            keywordEnable: true
        });
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
                map: map,
                //用于控制在搜索结束后，是否自动调整地图视野使绘制的Marker点都处于视口的可见范围
                autoFitView: false,

            });
            AMap.event.addListener(autocomplete_start, "select", function (e) {
                //TODO 针对选中的poi实现自己的功能
                //adcode区域编码
                placeSearch_start.setCity(e.poi.adcode);
                placeSearch_start.search(e.poi.name);
            });


            var autoOptions_end = {
                city: "",
                input: "endPointSearch"
            };
            var autocomplete_end = new AMap.Autocomplete(autoOptions_end);
            var placeSearch_end = new AMap.PlaceSearch({
                city: '',
                map: map,
                autoFitView: false,
            });
            AMap.event.addListener(autocomplete_end, "select", function (e) {
                //TODO 针对选中的poi实现自己的功能
                placeSearch_end.setCity(e.poi.adcode);
                placeSearch_end.search(e.poi.name);
            });
        });
        /*
        * 驾驶路径搜索
        */
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
                        width: 16,
                        //巡航器形状高度
                        height: 16,
                        content: 'defaultPathNavigator'
                        // content: PathSimplifier.Render.Canvas.getImageContent('./image/货车.jpg', function onload() {
                        //     //图片加载成功，重新绘制一次
                        //     pathSimplifierIns.renderLater();
                        // }, function onerror(e) {
                        //     alert('图片加载失败！');
                        // }),
                    }
                }
            });
            window.pathSimplifierIns = pathSimplifierIns;
        });
    };
    this.judgementTime = function () {
        if (remainingTime >= estimatedTime) {
            return true;
            // doNavigation();
        } else {
            // alert("This is impossible，Sir.")
            return false;
        }
    };
    this.doSearch = function () {
        remainingTime = MapFactory.setDeadline();
        estimatedTime = 0;
        var point = new Array();
        point[0] = {keyword: null, city: null};
        point[0].keyword = $("input[id='startPointSearch']").val();
        point[1] = {keyword: null, city: null};
        point[1].keyword = $("input[id='endPointSearch']").val();
        driving.clear();
        driving.search(point, function (status, result) {

            reSearchOrigin = new AMap.LngLat(result.origin.getLng(), result.origin.getLat());
            reSearchDestination = new AMap.LngLat(result.destination.getLng(), result.destination.getLat());

            $("input[id='reSearchOrigin']").val(reSearchOrigin.getLng().toString() + "," + reSearchOrigin.getLat().toString());
            $("input[id='reSearchDestination']").val(this.reSearchDestination.getLng().toString() + "," + this.reSearchDestination.getLat().toString());

            searchPathData = [];
            searchDistanceData = [];
            searchTimeData = [];
            searchSpeedData = [];
            searchTrafficData = [];

            for (var i = 0; i < result.routes.length; i++) {
                for (var j = 0; j < result.routes[i].steps.length; j++) {
                    searchPathData.push(result.routes[i].steps[j].path.slice(0));
                    searchDistanceData.push(result.routes[i].steps[j].distance);
                    searchTimeData.push(result.routes[i].steps[j].time);
                    searchSpeedData.push(result.routes[i].steps[j].distance * 0.001 / result.routes[i].steps[j].time * 360000);
                    searchTrafficData.push(result.routes[i].steps[j].tmcs.slice(0));

                }
            }
            searchTrafficDataFlag = [];
            for (var k = 0; k < searchTrafficData.length; k++) {
                searchTrafficDataFlag.push(false);
                for (var m = 0; m < searchTrafficData[k].length; m++) {
                    if (searchTrafficData[k][m].status === '拥堵' || searchTrafficData[k][m].status === '严重拥堵') {
                        searchTrafficDataFlag[k] = true;
                    }
                }
            }
            estimatedTime = 0;
            estimatedDistance = 0;
            for (var i = 0; i < result.routes.length; i++) {
                estimatedTime = estimatedTime + result.routes[i].time;
                estimatedDistance = estimatedDistance + result.routes[i].distance;
            }
            searchRemainingTime = estimatedTime;
            $("input[id='estimatedTime']").val(estimatedTime.toString());
            MapFactory.judgementTime(remainingTime, estimatedTime);
        });
    };
    this.doNavigation = function () {
        pathSimplifierIns.clearPathNavigators();
        var sync4Search = false;
        var sync4Expend = true;
        totalTime = 0;
        count = 0;
        index = 0;
        data = [{
            name: '动态路线',
            path: searchPathData[index].slice(0)
        }];

        pathSimplifierIns.setData(data);
        //对第一条线路（即索引 0）创建一个巡航器
        navg1 = pathSimplifierIns.createPathNavigator(0, {
            //循环播放
            loop: false,
            //巡航速度，单位千米/小时
            // speed: 6000
        });
        navg1.setSpeed(searchSpeedData[index]);
        totalTime = totalTime + searchTimeData[index];
        searchRemainingTime = searchRemainingTime - searchTimeData[index];
        remainingTime = deadline - totalTime;
        $("input[id='remainingTime']").val(remainingTime.toString());

        //flag是是否做路程扩展的判断标志
        expandPathFlag = true;
        expandPath = function () {
            if (navg1.getNaviStatus().toString() === 'pause' && navg1.isCursorAtPathEnd()) {
                if (index + 1 <= searchPathData.length - 1 && !searchTrafficDataFlag[index + 1]) {
                    expandPathFlag = doExpand();
                }
                /*
                //TODO 总结：回调函数导致的函数顺序执行结构混乱，用双setTimeout保持三者顺序执行
                 */
                else if (index + 1 <= searchPathData.length - 1 && searchTrafficDataFlag[index + 1]) {
                    setTimeout(function () {
                        if (sync4Search) {
                            console.log(reSearchOrigin);
                            console.log("前方出现拥堵！");
                            doSearch4Change();
                            sync4Search = false;
                        }
                    }, 0);
                    setTimeout(function () {
                        if (sync4Expend) {
                            expandPathFlag = doExpand4Change();
                            sync4Expend = false;
                        }
                    }, 0);
                }
            }
            if (expandPathFlag)
                setTimeout(expandPath, 1000);

            doSearch4Change = function () {
                console.log("doSearch4Change执行");
                driving.clear();
                estimatedTime = 0;
                reSearchOrigin = new AMap.LngLat(navg1.getPosition().getLng(), navg1.getPosition().getLat());
                driving.search(reSearchOrigin, reSearchDestination, function (status, result) {
                    console.log("search开始");
                    searchPathData = [];
                    searchDistanceData = [];
                    searchTimeData = [];
                    searchSpeedData = [];
                    searchTrafficData = [];

                    for (var i = 0; i < result.routes.length; i++) {
                        for (var j = 0; j < result.routes[i].steps.length; j++) {
                            searchPathData.push(result.routes[i].steps[j].path.slice(0));
                            searchDistanceData.push(result.routes[i].steps[j].distance);
                            searchTimeData.push(result.routes[i].steps[j].time);
                            searchSpeedData.push(result.routes[i].steps[j].distance * 0.001 / result.routes[i].steps[j].time * 360000);
                            searchTrafficData.push(result.routes[i].steps[j].tmcs.slice(0));

                        }
                    }
                    searchTrafficDataFlag = [];
                    for (var k = 0; k < searchTrafficData.length; k++) {
                        searchTrafficDataFlag.push(false);
                        for (var m = 0; m < searchTrafficData[k].length; m++) {
                            if (searchTrafficData[k][m].status === '拥堵' || searchTrafficData[k][m].status === '严重拥堵') {
                                searchTrafficDataFlag[k] = true;
                            }
                        }
                    }
                    estimatedTime = 0;
                    estimatedDistance = 0;
                    for (var i = 0; i < result.routes.length; i++) {
                        estimatedTime = estimatedTime + result.routes[i].time;
                        estimatedDistance = estimatedDistance + result.routes[i].distance;
                    }
                    searchRemainingTime = estimatedTime;
                    $("input[id='estimatedTime']").val(estimatedTime.toString());
                    MapFactory.judgementTime(remainingTime, estimatedTime);
                    console.log("search结束");
                    sync4Expend = true;

                });
                console.log("doSearch4Change结束");
            };
            doExpand = function () {
                count++;
                console.log("doExpand执行次数:" + count);

                index++;

                if (index >= searchPathData.length - 1)
                    return false;

                data[0].path = searchPathData[index].slice(0);

                //延展路径
                pathSimplifierIns.setData(data);
                //重新建立一个巡航器
                navg1 = pathSimplifierIns.createPathNavigator(0, {
                    loop: false,
                });

                navg1.setSpeed(searchSpeedData[index]);
                navg1.start();

                // navg1.moveToPoint(0, 0);

                totalTime += searchTimeData[index];
                searchRemainingTime = searchRemainingTime - searchTimeData[index];
                remainingTime = deadline - totalTime;
                $("input[id='remainingTime']").val(remainingTime.toString());
                console.log("doExpand结束");
                return true;
            };
            /*
            频繁search出bug原因：在于driving.search()中回调函数function(status,result)的异步执行
             */
            doExpand4Change = function () {
                console.log("doExpend2执行");

                if (reSearchOrigin.distance(reSearchDestination) < 10) {
                    return false;
                }
                index = 0;
                data[0].path = searchPathData[index].slice(0);
                //延展路径
                pathSimplifierIns.setData(data);

                //重新建立一个巡航器
                navg1 = pathSimplifierIns.createPathNavigator(0, {
                    loop: false,
                    // speed: 6000
                });
                navg1.setSpeed(searchSpeedData[index]);

                navg1.start();

                navg1.moveToPoint(0, 0);

                totalTime += searchTimeData[index];
                searchRemainingTime = searchRemainingTime - searchTimeData[index];
                remainingTime = deadline - totalTime;
                $("input[id='remainingTime']").val(remainingTime.toString());
                console.log("doExpend2结束");
                sync4Search = true;
                return true;
            };
        };
        navg1.start();

        expandPath();
    };
})
;
