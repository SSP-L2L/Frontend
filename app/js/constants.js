var activityBasepath= "http://10.131.245.91:8084/activiti-app/api";
var actAppPath= "http://10.131.245.91:8084/activiti-app/app";

var eventId = 0;
var eventType = {
    RW_PLAN:"RW_PLAN"
}

function generateId(){
    return eventId++;
}
