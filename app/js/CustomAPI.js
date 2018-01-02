// /*
//     该文档存放所有API有关变量/操作
//  */
//
//
// /*
//     TODO 1.使用覆盖物中Circle类包装终点，使用contains(point:LngLat)	判断是否在圆内部；2.巡航器中存在getPosition() 能拿到当前经纬度，所以可以尝试任意时刻切换导航目标。
//  */
//
// //导航路径点集（一个路段为一组的二维数组）
// var searchPathData;
// //路径距离（每段路段的长度）
// var searchDistanceData;
// //路径预计时间（每段路段的预计时间）
// var searchTimeData;
// //路径速度（用上述做除法得到的每段路段的速度）
// var searchSpeedData;
//
// //当前路径预计时间
// var estimatedTime;
//
// var estimatedDistance;
// //累计时间
// var totalTime = 0;
// //截止时间
// var deadline = 0;
// //路径剩余时间
// var searchRemainingTime = 0;
// //剩余时间
// var remainingTime = 0;
//
// var reSearchOrigin;
//
// var reSearchDestination;
//
// var flagExpandPath = true;
//
// var driving;
//
// var pathSimplifierIns;
//
// var count;
//
// /*
//     加载Map
//  */
// map = new AMap.Map("mapContainer", {
//     //是否监控地图容器尺寸变化，默认值为false
//     resizeEnable: true,
//     //地图显示的缩放级别
//     zoom: 13,
//     //地图是否可通过键盘控制,默认为true
//     keywordEnable: true
// });
//
//
// /*
//     地点搜索.输入提示
//  */
// AMap.plugin(['AMap.Autocomplete', 'AMap.PlaceSearch'], function () {
//     var autoOptions_start = {
//         //城市，默认全国
//         city: "",
//         //可选参数，用来指定一个input输入框，设定之后，在input输入文字将自动生成下拉选择列表
//         input: "startPointSearch"
//     };
//     var autocomplete_start = new AMap.Autocomplete(autoOptions_start);
//     var placeSearch_start = new AMap.PlaceSearch({
//         //兴趣点城市,默认全国
//         city: '',
//         //当指定此参数后，搜索结果的标注、线路等均会自动添加到此地图上。可选值
//         map: map,
//         //用于控制在搜索结束后，是否自动调整地图视野使绘制的Marker点都处于视口的可见范围
//         autoFitView: false,
//
//     });
//     AMap.event.addListener(autocomplete_start, "select", function (e) {
//         //TODO 针对选中的poi实现自己的功能
//         //adcode区域编码
//         placeSearch_start.setCity(e.poi.adcode);
//         placeSearch_start.search(e.poi.name);
//     })
//
//
//     var autoOptions_end = {
//         city: "",
//         input: "endPointSearch"
//     };
//     var autocomplete_end = new AMap.Autocomplete(autoOptions_end);
//     var placeSearch_end = new AMap.PlaceSearch({
//         city: '',
//         map: map,
//         autoFitView: false,
//     });
//     AMap.event.addListener(autocomplete_end, "select", function (e) {
//         //TODO 针对选中的poi实现自己的功能
//         placeSearch_end.setCity(e.poi.adcode);
//         placeSearch_end.search(e.poi.name);
//     });
// });
//
//
// /*
// * 驾驶路径搜索
// */
//
// AMap.service(["AMap.Driving"], function () {
//     var drivingOptions = {
//         //当指定此参数后，搜索结果的标注、线路等均会自动添加到此地图上。可选
//         map: map,
//         //结果列表的HTML容器id或容器元素，提供此参数后，结果列表将在此容器中进行展示。可选
//         // panel: 'panel',
//         //显示绿色代表畅通，黄色代表轻微拥堵，红色代表比较拥堵，灰色表示无路况信息。
//         showTraffic: true,
//         //将查询到的路径置于可视窗口
//         autoFitView: true,
//         //车牌省份的汉字缩写，用于判断是否限行，与number属性组合使用，可选。例如：京
//         province: '沪',
//         //除省份之外车牌的字母和数字，用于判断限行相关，与province属性组合使用，可选。例如:NH1N11
//         number: 'NH7085',
//         // hideMarkers: true,
//         //驾车策略:考虑实时路况;AMap.DrivingPolicy.LEAST_TIME 最快捷模式
//         policy: AMap.DrivingPolicy.LEAST_TIME   //AMap.DrivingPolicy.REAL_TRAFFIC
//     };
//     driving = new AMap.Driving(drivingOptions);
// });
//
// /*
//     路径展示
//  */
// AMapUI.load(['ui/misc/PathSimplifier', 'lib/$'], function (PathSimplifier, $) {
//
//     if (!PathSimplifier.supportCanvas) {
//         alert('当前环境不支持 Canvas！');
//         return;
//     }
//
//     pathSimplifierIns = new PathSimplifier({
//         //置顶选中的轨迹线；置顶的含义是，将该轨迹线的zIndex设置为现存最大值+1。默认true。
//         onTopWhenSelected: true,
//         autoSetFitView: false,
//         //所属的地图实例
//         map: map,
//
//         getPath: function (pathData, pathIndex) {
//             //返回轨迹数据中的节点坐标信息，[AMap.LngLat, AMap.LngLat...] 或者 [[lng|number,lat|number],...]
//             return pathData.path;
//         },
//         getHoverTitle: function (pathData, pathIndex, pointIndex) {
//             //返回鼠标悬停时显示的信息
//             if (pointIndex >= 0) {
//                 //鼠标悬停在某个轨迹节点上
//                 return pathData.name + '，点：' + pointIndex + '/' + pathData.path.length;
//             }
//             //鼠标悬停在节点之间的连线上
//             return pathData.name + '，点数量' + pathData.path.length;
//         },
//         renderOptions: {
//             //绘制路线节点，如不需要可设置为-1
//             renderAllPointsIfNumberBelow: -1,
//             autoSetFitView: true,
//             pathLineStyle: {
//                 strokeStyle: 'white',
//                 lineWidth: 4,
//                 dirArrowStyle: true
//             },
//             pathNavigatorStyle: {
//                 //巡航器形状宽度
//                 width: 16,
//                 //巡航器形状高度
//                 height: 16,
//                 content: 'defaultPathNavigator'
//                 // content: PathSimplifier.Render.Canvas.getImageContent('./image/货车.jpg', function onload() {
//                 //     //图片加载成功，重新绘制一次
//                 //     pathSimplifierIns.renderLater();
//                 // }, function onerror(e) {
//                 //     alert('图片加载失败！');
//                 // }),
//             }
//         }
//     });
//     window.pathSimplifierIns = pathSimplifierIns;
// });
//
//
// function doSearch() {
//     driving.clear();
//     estimatedTime = 0;
//     var point = new Array();
//     point[0] = {keyword: null, city: null};
//     point[0].keyword = $("input[id='startPointSearch']").val();
//     point[1] = {keyword: null, city: null};
//     point[1].keyword = $("input[id='endPointSearch']").val();
//     driving.clear();
//     driving.search(point, function (status, result) {
//         // reSearchOrigin = new AMap.LngLat(result.origin.getLng(), result.origin.getLat());
//         reSearchDestination = new AMap.LngLat(result.destination.getLng(), result.destination.getLat());
//         // console.log("reSearchOrigin:"+reSearchOrigin.getLng()+","+reSearchOrigin.getLat());
//         // console.log("reSearchDestination:"+reSearchDestination.getLng()+","+reSearchDestination.getLat());
//         // console.log("distance:"+reSearchOrigin.distance(reSearchDestination));
//         // $("input[id='reSearchOrigin_lng']").val(reSearchOrigin.getLng().toString());
//         // $("input[id='reSearchOrigin_lat']").val(reSearchOrigin.getLat().toString());
//         $("input[id='reSearchDestination_lng']").val(reSearchDestination.getLng().toString());
//         $("input[id='reSearchDestination_lat']").val(reSearchDestination.getLat().toString());
//
//         searchPathData = [];
//         searchPathData = result.routes[0].steps[0].path.slice(0);
//         searchDistanceData = result.routes[0].steps[0].distance;
//         searchTimeData = result.routes[0].steps[0].time;
//         searchSpeedData = (searchDistanceData * 0.001) / searchTimeData * 36000;
//         reSearchOrigin = new AMap.LngLat(searchPathData[searchPathData.length - 1].getLng(), searchPathData[searchPathData.length - 1].getLat());
//         estimatedTime = result.routes[0].time;
//         estimatedDistance = result.routes[0].distance;
//
//         searchRemainingTime = estimatedTime;
//         $("input[id='estimatedTime']").val(estimatedTime.toString());
//         judgementTime();
//     });
// }
//
// function doSearch4Change() {
//     driving.clear();
//     var drivingOptions = {
//         //当指定此参数后，搜索结果的标注、线路等均会自动添加到此地图上。可选
//         map: map,
//         //结果列表的HTML容器id或容器元素，提供此参数后，结果列表将在此容器中进行展示。可选
//         // panel: 'panel',
//         //显示绿色代表畅通，黄色代表轻微拥堵，红色代表比较拥堵，灰色表示无路况信息。
//         showTraffic: true,
//         //将查询到的路径置于可视窗口
//         autoFitView: false,
//         //车牌省份的汉字缩写，用于判断是否限行，与number属性组合使用，可选。例如：京
//         province: '沪',
//         //除省份之外车牌的字母和数字，用于判断限行相关，与province属性组合使用，可选。例如:NH1N11
//         number: 'NH7085',
//         // hideMarkers: true,
//         //驾车策略:考虑实时路况;AMap.DrivingPolicy.LEAST_TIME 最快捷模式
//         policy: AMap.DrivingPolicy.LEAST_TIME   //AMap.DrivingPolicy.REAL_TRAFFIC
//     };
//     driving = new AMap.Driving(drivingOptions);
//     estimatedTime = 0;
//     // console.log("判断distance:"+reSearchOrigin.distance(reSearchDestination));
//     if (reSearchOrigin.distance(reSearchDestination) < 30) {
//         return true;
//     }
//     driving.search(reSearchOrigin, reSearchDestination, function (status, result) {
//
//         // $("input[id='reSearchOrigin_lng']").val(reSearchOrigin.getLng().toString());
//         // $("input[id='reSearchOrigin_lat']").val(reSearchOrigin.getLat().toString());
//         // $("input[id='reSearchDestination_lng']").val(reSearchDestination.getLng().toString());
//         // $("input[id='reSearchDestination_lat']").val(reSearchDestination.getLat().toString());
//
//         searchPathData = [];
//         searchPathData = result.routes[0].steps[0].path.slice(0);
//         searchDistanceData = result.routes[0].steps[0].distance;
//         searchTimeData = result.routes[0].steps[0].time;
//         searchSpeedData = (searchDistanceData * 0.001) / searchTimeData * 36000;
//         reSearchOrigin = new AMap.LngLat(searchPathData[searchPathData.length - 1].getLng(), searchPathData[searchPathData.length - 1].getLat());
//         // console.log("reSearchOrigin:"+reSearchOrigin.getLng()+","+reSearchOrigin.getLat());
//         // console.log("reSearchDestination:"+reSearchDestination.getLng()+","+reSearchDestination.getLat());
//         // console.log("distance:"+reSearchOrigin.distance(reSearchDestination));
//         estimatedTime = result.routes[0].time;
//         estimatedDistance = result.routes[0].distance;
//
//         searchRemainingTime = estimatedTime;
//         $("input[id='estimatedTime']").val(estimatedTime.toString());
//         judgementTime();
//     });
//     return false;
// }
//
// function doNavigation() {
//     pathSimplifierIns.clearPathNavigators();
//     totalTime = 0;
//     count = 0;
//     // $("input[id='reSearchOrigin_lng']").val(reSearchOrigin.getLng().toString());
//     // $("input[id='reSearchOrigin_lat']").val(reSearchOrigin.getLat().toString());
//     // $("input[id='reSearchDestination_lng']").val(reSearchDestination.getLng().toString());
//     // $("input[id='reSearchDestination_lat']").val(reSearchDestination.getLat().toString());
//     var data = [{
//         name: '动态路线',
//         path: searchPathData.slice(0)
//     }];
//
//     pathSimplifierIns.setData(data);
//
//     //对第一条线路（即索引 0）创建一个巡航器
//     var navg1 = pathSimplifierIns.createPathNavigator(0, {
//         //循环播放
//         loop: false,
//         //巡航速度，单位千米/小时
//         // speed: 6000
//     });
//     navg1.setSpeed(searchSpeedData);
//
//     totalTime += searchTimeData;
//     searchRemainingTime = searchRemainingTime - searchTimeData;
//     $("input[id='estimatedTime']").val(estimatedTime.toString());
//     remainingTime = remainingTime - totalTime;
//     $("input[id='remainingTime']").val(remainingTime.toString());
//
//     //flag是是否做路程扩展的判断标志
//     flagExpandPath = true;
//     navg1.start();
//
//     expandPath();
//
//     function expandPath() {
//         if (navg1.getNaviStatus().toString() === 'pause' && navg1.isCursorAtPathEnd()) {
//             console.log("searchPathData:"+searchPathData[searchPathData.length-1].getLng()+","+searchPathData[searchPathData.length-1].getLat());
//             console.log("researchOrigin:"+reSearchOrigin.getLng()+","+reSearchOrigin.getLat());
//             console.log("getPosition:"+navg1.getPosition());
//             console.log("====================================")
//             flagExpandPath = doExpand();
//             console.log("====================================")
//         }
//         if (flagExpandPath)
//             setTimeout(expandPath, 1000);
//
//         function doExpand() {
//             // if (reSearchOrigin.distance(reSearchDestination) < 100) {
//             //     return false;
//             // }
//             // if (endIndex >= myPath.length) {
//             //     return false;
//             // }
//             // navg1.moveToPoint(navg1.getPathEndIdx,0);
//             console.log(++count);
//             if (doSearch4Change())
//                 return false;
//             // for (var i = 0; i < searchPathData[0].length; i++) {
//             //     myPath.push(searchPathData[0][i]);
//             // }
//             // myPath.push(searchPathData.slice(0));
//             // $("input[id='reSearchOrigin_lng']").val(reSearchOrigin.getLng().toString());
//             // $("input[id='reSearchOrigin_lat']").val(reSearchOrigin.getLat().toString());
//             // $("input[id='reSearchDestination_lng']").val(reSearchDestination.getLng().toString());
//             // $("input[id='reSearchDestination_lat']").val(reSearchDestination.getLat().toString());
//             //保存巡航器的位置
//             // var cursor = navg1.getCursor().clone();
//             // var status = navg1.getNaviStatus();
//             data[0].path = searchPathData.slice(0);
//             //延展路径
//             pathSimplifierIns.setData(data);
//             //
//             //
//             // //重新建立一个巡航器
//             navg1 = pathSimplifierIns.createPathNavigator(0, {
//                 loop: false,
//                 // speed: 6000
//             });
//             navg1.setSpeed(searchSpeedData);
//             // if (status !== 'stop') {
//             //     navg1.start();
//             // }
//             navg1.start();
//             // //恢复巡航器的位置
//             // if (cursor.idx >= 0) {
//             //     navg1.moveToPoint(cursor.idx, cursor.tail);
//             // }
//             navg1.moveToPoint(1,0);
//
//             totalTime += searchTimeData;
//             searchRemainingTime = searchRemainingTime - searchTimeData;
//             remainingTime = deadline - totalTime;
//             $("input[id='remainingTime']").val(remainingTime.toString());
//
//             return true;
//         }
//     }
// }
//
//
// function setDeadline() {
//     deadline = $("input[id='deadline']").val();
//     remainingTime = deadline;
//     $("input[id='remainingTime']").val(remainingTime.toString());
// }
//
//
// function judgementTime() {
//     if (remainingTime >= estimatedTime) {
//         return true;
//         // doNavigation();
//     } else {
//         // alert("This is impossible，Sir.")
//         return false;
//     }
// }
//
//
