App.service('Session',function (localStorageService) {

    this.createlastEventId=function () {
        localStorageService.set("lastEventId",0);
    };
    this.getLastEventId=function () {
        return localStorageService.get("lastEventId");
    };
    this.setlastEventId=function (value) {
        localStorageService.set("lastEventId",value);
    }
    this.createEventId=function () {
        localStorageService.set("evenId",0);
    }
    this.getEventId=function () {
        return localStorageService.get("eventId");
    };
    this.setEventId=function (value) {
        localStorageService.set("eventId",value);
    };
    this.generateId=function () {
        var temp=localStorageService.get("eventId");
        temp++;
        this.setEventId(temp);
        return temp;
    }
});
