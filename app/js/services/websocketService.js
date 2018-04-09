'use strict';

//vessel shadow
var vesselShadow ={};
//establish connection
var httpUrl = "http://10.131.245.91:8084/activiti-app/api/sps";
var socket = new SockJS(httpUrl);
var stompClient = Stomp.over(socket);
// var wsUrl = "ws://10.131.245.91:8084/activiti-app/api/sps";
// var stompClient = Stomp.client(wsUrl);

// stompClient.heartbeat.outgoing = 1000;
// stompClient.heartbeat.incoming = 1000;
var onTest1 = function(message) {
    console.log("glp test1:");
}

var onConnected = function() {
    console.log("Connect to activiti successfully : ");
    // stompClient.subscribe("/queue/test1", onTest1);
    // stompClient.subscribe("/queue/greetings",onMessageReceived);
    // stompClient.send("/app/hello", {}, JSON.stringify({'name' : 'Stomp over WebSocket'}));
    stompClient.subscribe("/user/queue/greetings1",onMessageReceived);
    stompClient.send("/app/hello1", {}, JSON.stringify({'name' : 'Stomp over WebSocket with authenticated'}));
    stompClient.subscribe("/user/topic/vesselShadow", onUpdateVesselShadow);
    stompClient.subscribe("/topic/vesselShadow", onUpdateVesselShadow);

};

var onError =  function(error) {
    console.log(error);
};

var onMessageReceived = function(payload){
    console.log("greetings form activiti :" , payload);
}
var onUpdateVesselShadow = function(frame){
    console.log("Received vessel shadow : ", JSON.parse(frame.body));
}


// var headers={
//     username:'admin',
//     password:'test'
// }
stompClient.connect({}, onConnected ,onError);
