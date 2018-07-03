var  map;
var port32 = new AMap.Icon({
    image: "images/port32.png",
    size: new AMap.Size(32, 32)
});;  //使用中的港口，icon类
var uselessPort32 = new AMap.Icon({
    image: "images/useless-port32.png",
    size: new AMap.Size(32, 32)
});;   //未使用中的港口，icon类
var mapCenter =  ["114.52105", "30.6827"];
var mapZoom = 5;
function initMap() {

    //TODO: 加载Map
    map = new AMap.Map("mapContainer", {
        //是否监控地图容器尺寸变化，默认值为false
        resizeEnable: true,
        //地图显示的缩放级别
        zoom: mapZoom,
        center: mapCenter,
        //地图是否可通过键盘控制,默认为true
        keywordEnable: true
    });


    //TODO:加载搜索
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
                if (manager !== undefined) {
                    manager.hide();
                }
                manager = MapFactory.setManager(result.poiList.pois[0].name, result.poiList.pois[0].location);

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
                if (supplier !== undefined) {
                    supplier.hide();
                }
                supplier = MapFactory.setSupplier(result.poiList.pois[0].name, result.poiList.pois[0].location);
                var supplierData = {
                    slname: e.poi.name,
                    x_coor:result.poiList.pois[0].location.getLng(),
                    y_coor:result.poiList.pois[0].location.getLat()
                };
                console.log("result:",result.poiList.pois[0].location.getLat());
                $http.post(activityBasepath + '/supplier/location/', supplierData)
                    .success(function (data) {
                        console.log("supplier location:", data);
                    })
            });
        });
    });


    /*
    加载toaster
     */
    $.toaster({
        settings: {
            toaster: {
                css: {
                    top: '10%',
                    right: '5%'
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
            timeout: 10000
        }
    });
};


// var navg1 = {};
// AMapUI.load(['ui/misc/PathSimplifier'], function(PathSimplifier) {
//
//     if (!PathSimplifier.supportCanvas) {
//         alert('当前环境不支持 Canvas！');
//         return;
//     }
//
//     //启动页面
//     initPage2(PathSimplifier);
//     navg1.start();
// });
// function initPage2(PathSimplifier) {
//     //创建组件实例
//     var pathSimplifierIns = new PathSimplifier({
//         zIndex: 100,
//         autoSetFitView : false,
//         map: map, //所属的地图实例
//         getPath: function(pathData, pathIndex) {
//             //返回轨迹数据中的节点坐标信息，[AMap.LngLat, AMap.LngLat...] 或者 [[lng|number,lat|number],...]
//             return pathData.path;
//         },
//         getHoverTitle: function(pathData, pathIndex, pointIndex) {
//             //返回鼠标悬停时显示的信息
//             if (pointIndex >= 0) {
//                 //鼠标悬停在某个轨迹节点上
//                 return pathData.name + '，点:' + pointIndex + '/' + pathData.path.length;
//             }
//             //鼠标悬停在节点之间的连线上
//             return pathData.name + '，点数量' + pathData.path.length;
//         },
//         renderOptions: {
//             //轨迹线的样式
//             pathLineStyle: {
//                 strokeStyle: '#c61dcc',
//                 lineWidth: 6,
//                 dirArrowStyle: true
//             }
//         }
//     });
//
//     //这里构建两条简单的轨迹，仅作示例
//     pathSimplifierIns.setData([{
//         name: '大地线',
//         //创建一条包括500个插值点的大地线
//         path: PathSimplifier.getGeodesicPath([116.405289, 39.904987], [87.61792, 43.793308], 500)
//     }]);
//
//     //创建一个巡航器
//     navg1 = pathSimplifierIns.createPathNavigator(0, //关联第1条轨迹
//         {
//             loop: true, //循环播放
//             speed: 1000000,
//             pathNavigatorStyle: {
//                 autoRotate: true, //禁止调整方向
//                 initRotateDegree : 0,
//                 pathLinePassedStyle: null,
//                 width: 24,
//                 height: 24,
//                 content: PathSimplifier.Render.Canvas.getImageContent('images/vessel.png', onload, onerror),
//                 strokeStyle: null,
//                 fillStyle: null
//             }
//         });
//
// }


