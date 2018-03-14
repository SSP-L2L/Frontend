'use strict';
// 对象工厂函数定义一个服务，调用工厂函数返回服务实例，这里是拦截器
App.factory('HttpInterceptor' , HttpInterceptor);
// httpRequest拦截处理函数
function HttpInterceptor(){
    return {
        // preventing duplicate requests
        'request' : function(config){ // request : 接受一个参数，他是标准的config对象 ，
            // 同时也需要返回一个标准的config
            // config.authorization
            config.headers = config.headers || {} ;
            // 检查登录状态，如果已经登录，提取Session中credentials , 设置到请求头中
            config.headers.Authorization = 'Basic YWRtaW46dGVzdA==';
            return config;
        },

    };
}

// 注册到Interceptors数组
App.config(['$httpProvider' , function($httpProvider){
    $httpProvider.interceptors.push('HttpInterceptor');// 为httpProvider添加一些配置
}]);