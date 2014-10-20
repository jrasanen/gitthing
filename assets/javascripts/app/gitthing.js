'use strict';

var gitthing = angular.module('gitthingApp', [
    'ngCookies', 'ngResource', 'ngRoute',
    'gitthing.controllers', 'gitthing.services'
]);


window.routes =
{
    "/index": {
        templateUrl: '/static/templates/home.html',
        controller: 'HomeCtrl',
        redir: true
    },
    "/login": {
        templateUrl: '/static/templates/login.html',
        controller: 'LoginCtrl',
        redir: true
    },
    "/logout": {
        templateUrl: '/static/templates/logout.html',
        controller: 'LogoutCtrl',
        redir: false
    },
    "/repo/:permalink": {
        templateUrl: '/static/templates/repository.html',
        controller: 'RepositoryCtrl'
    },
    "/repo/:permalink/blob/:branch/:blobpath*": {
        templateUrl: '/static/templates/blob.html',
        controller: 'BlobCtrl'
    },
    "/repo/:permalink/tree/:branch/:blobpath*": {
        templateUrl: '/static/templates/tree.html',
        controller: 'TreeCtrl'
    }
};

gitthing.constant('uriConst', {
    backend: '__BACKEND__'
});

gitthing.config(['$routeProvider', '$locationProvider', '$httpProvider', function($routeProvider, $locationProvider, $httpProvider) {
    //$resourceProvider.defaults.stripTrailingSlashes = true;
    for(var path in window.routes) {
        $routeProvider.when(path, window.routes[path]);
        console.log("Loading route", path);
    }
    $routeProvider.otherwise({redirectTo: '/index'});
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');
}])

gitthing.run(['$rootScope', 'SessionService', '$location', '$http', function ($rootScope, SessionService, $location, $http) {


    var initialized = false;
    
    $rootScope.$on("$locationChangeStart", function(event, next, current) {
        var authToken = "xx"; //SessionService.getToken();

        console.log(next, current);
    });
    


}]);
