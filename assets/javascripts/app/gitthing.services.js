'use strict';

var services = angular.module('gitthing.services', ['ngCookies']);

services.service('RepositoryService', ['$cookieStore', '$http', '$q', 'uriConst', '$location', function ($cookieStore, $http, $q, uriConst, $location) {
    var repo = $q.defer();
    var repos = $q.defer();
    this.getRepoByPermalink = function (permalink) {
        $http.get(uriConst.backend + '/repos/' + permalink).
          success(function(data, status, headers, config) {
            repo.resolve(data.data);
            repo = $q.defer(); // Reset promise
          }).
          error(function(data, status, headers, config) {
            repo.reject(data);
          });
        return repo.promise;
    };
    this.getAll = function () {
        $http.get(uriConst.backend + '/repos/').
          success(function(data, status, headers, config) {
            repo.resolve(data.data);
            repo = $q.defer(); // Reset promise
          }).
          error(function(data, status, headers, config) {
            repo.reject(data);
          });
        return repo.promise;
    };
}]);

services.service('TreeService', ['$cookieStore', '$http', '$q', 'uriConst', '$location', function ($cookieStore, $http, $q, uriConst, $location) {
    var blob = $q.defer();
    this.getTree = function (permalink, branch, path) {
        $http.get(uriConst.backend + '/repos/' + permalink + '/tree/' + branch + '/' + path).
          success(function(data, status, headers, config) {
            blob.resolve(data.data);
            blob = $q.defer(); // Reset promise
          }).
          error(function(data, status, headers, config) {
            blob.reject(data);
          });
        return blob.promise;
    };
}]);

services.service('BlobService', ['$cookieStore', '$http', '$q', 'uriConst', '$location', function ($cookieStore, $http, $q, uriConst, $location) {
    var blob = $q.defer();
    this.getBlob = function (permalink, branch, path) {
        $http.get(uriConst.backend + '/repos/' + permalink + '/blob/' + branch + '/' + path).
          success(function(data, status, headers, config) {
            blob.resolve(data.data);
            blob = $q.defer(); // Reset promise
          }).
          error(function(data, status, headers, config) {
            blob.reject(data);
          });
        return blob.promise;
    };
}]);

services.service('SessionService', ['$cookieStore', '$http', '$q', 'uriConst', '$location', function ($cookieStore, $http, $q, uriConst, $location) {
    var userIsAuthenticated = false;
    var user = $q.defer();
    var onLoginCallbacks = [];
    var token = null;

    var runOnLogin = function (args) {
        args = [args];
        for (var i = onLoginCallbacks.length - 1; i >= 0; i--) {
            if (onLoginCallbacks[i]) {
                onLoginCallbacks[i].apply(undefined, args);
            }
        };
    };
    this.onLogin = function(func) {
        onLoginCallbacks.push(func);
    };
    this.logout = function () {
        $cookieStore.remove("token");
        this.setUserAuthenticated(false);
    };
    this.setUserAuthenticated = function (val) {
        console.log("User authenticated: ", val);
        this.getToken();
        userIsAuthenticated = val;
        runOnLogin(user);
    };
    this.getUserAuthenticated = function () {
        console.log("Get authenticated: ", userIsAuthenticated);
        return userIsAuthenticated;
    };
    this.setToken = function (token, callback) {
        $cookieStore.put("token", token);
        return callback(token);
    };
    this.getToken = function () {
        token = $cookieStore.get("token");
        if (!token) return false;
        var jwt = token.split(".");
        var claims = JSON.parse(window.atob(jwt[1]));
        user.resolve(claims.d.user);
        return token;
    };
    this.getUser = function () {
        return user.promise;
    };
    this.auth = function(user, onSuccess) {
        var self = this;
        $http.post(uriConst.backend + '/session', user).success(function (d) {
            var token = d.token;
            console.log("Auth success ", token);
            self.setToken(token, function (token) {
            	onSuccess();
            });
        }).error(function(d) {
            console.log(d);
        });
    };
}]);


