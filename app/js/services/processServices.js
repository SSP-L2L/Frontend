'use strict'

App.factory('VesselProcessService', ['$http', '$q', function ($http, $q) {
  return {
	  GetProcessInstance : function(params) {
		  // console.log("************Get : ProcessInstance*********************");
		  var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行
		  $http.get(activityBasepath+'/runtime/process-instances', params).
		  success(function(data, status, headers, config) {
			  // //console.log("GetProcessInstance : success : --> data : " + data.data[0].id);
			  deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
		  }).error(function(data, status, headers, config) {
			  deferred.reject(data);   // 声明执行失败，即服务器返回错误
		  });
		  return deferred.promise;   // 返回承诺，这里并不是最终数据，而是访问最终数据的API
	  } ,

	  GetProcessVariablesById : function(pid) {
		  // console.log("************Get : ProcessVariablesById*********************");
	      var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行
	      $http.get(activityBasepath+'/zbq/variables/'+pid).
	      success(function(data, status, headers, config) {
	    	  // console.log("GetProcessVariablesById : success : --> data : " + data);
	    	  deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
	      }).
	      error(function(data, status, headers, config) {
	        deferred.reject(data);   // 声明执行失败，即服务器返回错误
	      });
	      return deferred.promise;   // 返回承诺，这里并不是最终数据，而是访问最终数据的API
	  } ,
	  /**
	   * PutProcessVariables
	   */
	  PutProcessVariable : function(pid , vName , vValue) {
		  // // console.log("************PutProcessVariables*********************");
	      var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行
	      $http.put(activityBasepath+'/runtime/process-instances/'+pid+'/variables/' + vName, vValue).
	      success(function(data, status, headers, config) {
	    	  // // console.log("PutProcessVariables : success : --> data : " + data);
	    	  deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
	      }).
	      error(function(data, status, headers, config) {
	    	  deferred.reject(data);   // 声明执行失败，即服务器返回错误
	      });
	      return deferred.promise;   // 返回承诺，这里并不是最终数据，而是访问最终数据的API
	  } ,
      PutProcessVariables : function(pid  , vValue) {
          // // console.log("************PutProcessVariables*********************");
          var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行
          // $http.put(activityBasepath+'/runtime/process-instances/'+pid+'/variables' , vValue).
          $http.put(activityBasepath+'/zbq/variables/'+pid , vValue).
          success(function(data, status, headers, config) {
              // // console.log("PutProcessVariables : success : --> data : " + data);
              deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
          }).
          error(function(data, status, headers, config) {
              deferred.reject(data);   // 声明执行失败，即服务器返回错误
          });
          return deferred.promise;   // 返回承诺，这里并不是最终数据，而是访问最终数据的API
      } ,

      /**
	   *  CompleteVoyagingPart
	   */
	  CompleteVoyagingPart : function(voyTaskId) {
		  // // console.log("************Action--->CompleteVoyagingPart*********************");
	      var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行
	      $http.put(activityBasepath+'/tasks/'+voyTaskId+'/action/complete').
	      success(function(data, status, headers, config) {
	    	  // // console.log("  CompleteVoyagingPart : success : --> data : " + data);
	    	  deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
	      }).
	      error(function(data, status, headers, config) {
	    	  deferred.reject(data);   // 声明执行失败，即服务器返回错误
	      });
	      return deferred.promise;   // 返回承诺，这里并不是最终数据，而是访问最终数据的API
	  } ,

	  /**
	   *  QueryVoyagingTask
	   */
	  QueryVoyagingTask : function(TaskName) {
		  // // console.log("************Query-->VoyagingTask *********************");
	      var deferred = $q.defer(); // 声明延后执行，表示要去监控后面的执行
	      var params = {
	    		  params : {
	    			  name : TaskName
	    		  }
	      };
	      $http.get(activityBasepath+'/runtime/tasks', params).
	      success(function(data, status, headers, config) {
	    	  // console.log(" QueryVoyagingTask : success : --> data : " + data);
	    	  deferred.resolve(data);  // 声明执行成功，即http请求数据成功，可以返回数据了
	      }).
	      error(function(data, status, headers, config) {
	    	  deferred.reject(data);   // 声明执行失败，即服务器返回错误
	      });
	      return deferred.promise;   // 返回承诺，这里并不是最终数据，而是访问最终数据的API
	  } ,
	  /**
	   * 在变量表中查找变量
	   */
	  FindVarIdxByName : function(vVariables){
			var i = 0;
			var pIdxs = {};
			var arr = vVariables;
			for(i in arr){
				pIdxs[arr[i]['name']] = i;
			}

			return pIdxs;
	 }

  };

}]);