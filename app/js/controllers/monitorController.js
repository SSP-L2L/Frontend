'use strict'
angular.module('myApp.monitor')
    .controller('MonitorCtrl', function ($http, $scope, MapService, MapFactory, VesselProcessService, $interval, Session, $filter) {
        AMapUI.load(['ui/misc/PathSimplifier'], function (PathSimplifier) {

            if (!PathSimplifier.supportCanvas) {
                alert('当前环境不支持 Canvas！');
                return;
            }

            /**
             * **************************************************************************************************
             * TODO : some logics associated with vessel and vessel
             * ************************************************************************************************
             */
            //Init Map
            MapService.initMap();

            $scope.vesselShadows = new Map();         //vessel shadow
            $scope.vHttpUrl = vesselA_server + 'api/sps';
            $scope.vSocket = new SockJS($scope.vHttpUrl);
            $scope.vesselStompClient = Stomp.over($scope.vSocket);
            $scope.vmarker = null;
            $scope.onConnected = function () {
                console.log("Connect to vessel-A successfully : ");
                $scope.vesselStompClient.subscribe("/user/queue/greetings1", $scope.onMessageReceived);
                $scope.vesselStompClient.send("/app/hello1", {}, JSON.stringify({'name': 'Stomp over WebSocket with authenticated'}));
                $scope.vesselStompClient.subscribe("/user/topic/vesselShadow", $scope.onUpdateVesselShadow);
                $scope.vesselStompClient.subscribe("/topic/vesselShadow", $scope.onUpdateVesselShadow);

            };

            $scope.onError = function (error) {
                console.log(error);
            };
            $scope.onMessageReceived = function (payload) {
                console.log("greetings form activiti :", payload);
            }
            $scope.onUpdateVesselShadow = function (frame) {
                var vesselShadow = JSON.parse(frame.body).vesselShadow;
                // console.log("Received vessel shadow : ", vesselShadow);
                var frameData = JSON.parse(frame.body);
                $scope.vesselShadows.set(vesselShadow.id,vesselShadow);
                if ($scope.vmarker !== null) {
                    $scope.vmarker.hide();
                }

                $scope.vmarker = new AMap.Marker({ // 加点
                    map: map,
                    position: [vesselShadow.longitude, vesselShadow.latitude],
                    icon: new AMap.Icon({ // 复杂图标
                        size: new AMap.Size(64, 64), // 图标大小
                        image: "images/vessel.png",// 大图地址
                    })
                });

            }
            $scope.vesselStompClient.connect({}, $scope.onConnected, $scope.onError);
            /**
             * Start Vessel process
             */
            $scope.vid = "413362260";  //船的id
            $scope.sailor = 'admin';    //操作员
            $scope.startVessel = function () {
                var params = {
                    sailor: $scope.sailor,
                    vid: $scope.vid,
                    defaultDelayHour: 5,
                    zoomInVal: 1000
                };

                $http.post(vesselA_server + "api/process-instances/vessel-part", params)
                    .success(function (data) {
                        console.log("Start Vessel process ...", data);
                    });
            };

            /**
             * Delay Or postpone when at anchoring or docking state
             */
            $scope.delayHour = 0;
            $scope.postponeHour = 0;
            $scope.dpVid = "413362260"

            $scope.setDxy = function () {
                var params = {
                    'delayHour': $scope.delayHour,
                    'postponeHour': $scope.postponeHour
                };
                $http.post("/message/delay/" + $scope.dpVid, params)
                    .success(function (data) {
                        console.log("set delayHour or postpone Hour ", data);
                    });
            }


            /**
             * ABOUT WEAGON LOGIC AS FOLLOWING
             */
            $scope.wagonShadows = new Map();         //vessel shadow
            console.log("attempt to create logistic stomp client...");
            $scope.logAhttpUrl = logisticA_server + 'api/sps';
            $scope.logASocket = new SockJS($scope.logAhttpUrl);
            $scope.logAStompClient = Stomp.over($scope.logASocket);
            $scope.logAmarker = null;
            $scope.onConnected = function () {
                console.log("Connect to logistic-A successfully : ");
                $scope.logAStompClient.subscribe("/user/topic/route", $scope.onUpdateLogisticAShadow);
                // $scope.logAStompClient.send("/app/testPath", {}, JSON.stringify({'name': 'Stomp over WebSocket with authenticated'}));

            };
            $scope.onUpdateLogisticAShadow = function (frame) {
                var frameData = JSON.parse(frame.body);
                var pid = frameData.from;
                var rendezvous = frameData.msgBody;
                var polyline = rendezvous.route.polyline;
                var pathData = [];
                for (var i = 0; i < polyline.length; i++) {
                    var pArr = [polyline[i].longitude, polyline[i].latitude];
                    pathData.push(pArr);
                }
                // console.log("Received new rendezvous : ", rendezvous.name, "from : ", pid);

                var pathData = {
                    name: rendezvous.name,
                    path: pathData
                };
                var pathDatas = [];
                var distance = rendezvous.route.distance; //m
                var duration = rendezvous.route.duration; //ms

                pathDatas.push(pathData);
                console.log("load path simplifier...");
                var wagonManager = {
                    speed: distance/duration*3.6*zoomInVal,
                    pathDatas: pathDatas,
                    pathSimplifierIns: {},
                    navigator: null
                }
                loadWagonSimulator(wagonManager, 0);
                console.log("start navigator...")
                wagonManager.navigator.start();
                var navTimer = $interval(function () {
                    var position = wagonManager.navigator.getPosition();
                    navg1Posion=position;
                    var requestBody = {
                        longitude : position.getLng(),
                        latitude : position.getLat(),
                        speed : wagonManager.navigator.getSpeed(),
                        movedDistance : wagonManager.navigator.getMovedDistance()
                    }
                    //TODO : check whether the wagon arrived
                    if(wagonManager.navigator.isCursorAtPathEnd() == true){
                        $http.post(logisticA_server + 'api/'+pid+'/arrival', {megType : "arrival"})
                            .success(function (data) {
                                $.toaster("车已到达指定地点！"+rendezvous.name, 'Wagon', 'success');
                                $interval.cancel(navTimer);
                            });
                    }else{
                        $http.post(logisticA_server + 'api/'+pid+'/shadow', requestBody)
                            .success(function (data) {
                                console.log("upload to wagon shadow : ", requestBody);
                            });
                    }
                } , 1000)
            }
            $scope.logAStompClient.connect({}, $scope.onConnected, $scope.onError);


            /**
             * load PathSimplifier
             */
            function loadWagonSimulator(wagonManager, idx) {
                //加载PathSimplifier，loadUI的路径参数为模块名中 'ui/' 之后的部分
                // var pathSimplifierIns = {};
                wagonManager.pathSimplifierIns = createPathSimplifierIns();
                wagonManager.pathSimplifierIns.setData(wagonManager.pathDatas);
                wagonManager.navigator = createNavigator(wagonManager.pathSimplifierIns, idx , wagonManager.speed);
            }

            function createPathSimplifierIns() {
                return new PathSimplifier({
                    zIndex: 100,
                    autoSetFitView: false,
                    map: map, //所属的地图实例
                    getPath: function (pathData, pathIndex) {
                        //返回轨迹数据中的节点坐标信息，[AMap.LngLat, AMap.LngLat...] 或者 [[lng|number,lat|number],...]
                        return pathData.path;
                    },
                    getHoverTitle: function (pathData, pathIndex, pointIndex) {
                        //返回鼠标悬停时显示的信息
                        if (pointIndex >= 0) {
                            //鼠标悬停在某个轨迹节点上
                            return pathData.name + '，点:' + pointIndex + '/' + pathData.path.length;
                        }
                        //鼠标悬停在节点之间的连线上
                        return pathData.name + '，点数量' + pathData.path.length;
                    },
                    renderOptions: {
                        //轨迹线的样式
                        pathLineStyle: {
                            strokeStyle: '#4acc11',
                            lineWidth: 6,
                            dirArrowStyle: true
                        }
                    }
                });
            }

            function createNavigator(pathSimplifierIns, idx , speed) {
                return pathSimplifierIns.createPathNavigator(idx, //关联第1条轨迹
                    {
                        loop: false, //循环播放
                        speed: speed,
                        pathNavigatorStyle: {
                            autoRotate: true, //禁止调整方向
                            width: 25,
                            height: 30,
                            // initRotateDegree: 90,
                            content: PathSimplifier.Render.Canvas.getImageContent(mapBaseUrl+'imgs/car.png', onload, onerror),
                            //经过路径的样式
                            pathLinePassedStyle: {
                                lineWidth: 6,
                                strokeStyle: 'black',
                                dirArrowStyle: {
                                    stepSpace: 15,
                                    strokeStyle: 'red'
                                }
                            }
                        }
                    });
            }


        });
        

    })