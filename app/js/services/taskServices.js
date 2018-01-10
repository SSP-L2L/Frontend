'use strict';

App.factory('TaskService', ['$http', '$q', function ($http, $q) {
    return {
        /**
         *  CompleteVoyagingPart
         */
        CompleteTask: function (voyTaskId) {
            console.log("************Action--->CompleteVoyagingPart*********************");
            var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行
            $http.put(activityBasepath + '/tasks/' + voyTaskId + '/action/complete').success(function (data, status, headers, config) {
                console.log("  CompleteVoyagingPart : success : --> data : " + data);
                deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
            }).error(function (data, status, headers, config) {
                deferred.reject(data);   // 声明执行失败，即服务器返回错误
            });
            return deferred.promise;   // 返回承诺，这里并不是最终数据，而是访问最终数据的API
        },

        /**
         *  QueryVoyagingTask
         */
        QueryTask: function (TaskName) {
            console.log("************Query-->VoyagingTask *********************");
            var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行
            var params = {
                params: {
                    name: TaskName
                }
            };
            $http.get(activityBasepath + '/runtime/tasks', params).success(function (data, status, headers, config) {
                console.log(" QueryVoyagingTask : success : --> data : " + data);
                deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
            }).error(function (data, status, headers, config) {
                deferred.reject(data);   // 声明执行失败，即服务器返回错误
            });
            return deferred.promise;   // 返回承诺，这里并不是最终数据，而是访问最终数据的API
        }
    }

}]);