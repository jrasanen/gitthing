'use strict';

var ctrl = angular.module('gitthing.controllers', ['ngCookies']);

ctrl.controller('HomeCtrl', ['$scope', function($scope) {
}]);


ctrl.controller('BlobCtrl', ['$scope', '$routeParams', 'BlobService', function($scope, $routeParams, BlobService) {
	
	console.log($routeParams.permalink, $routeParams.branch, $routeParams.blobpath);
	$scope.data = null;
	$scope.message = null;
	$scope.path = null;
	$scope.repo = {
		'permalink': $routeParams.permalink,
		'name': $routeParams.permalink
	}
	$scope.filename = $routeParams.blobpath;

	BlobService.getBlob($routeParams.permalink, $routeParams.branch, $routeParams.blobpath).then(function(blob) {
		$scope.data = blob.data;
		$scope.message = blob.message;
		$scope.path = blob.path;
	});

}]);

ctrl.controller('TreeCtrl', ['$scope', '$routeParams', 'TreeService', function($scope, $routeParams, TreeService) {
	var path = $routeParams.blobpath;
	if(path.substr(-1) == '/') {
        path = path.substr(0, path.length - 1);
    }
    var pathArr = path.split("/");
	$scope.data = null;
	$scope.message = null;
	$scope.path = path
	$scope.currentTree = pathArr[pathArr.length-1];
	$scope.breadcrumbs = path.split("/").map(function (cur, index, a) {
		var crumby = {};
		var reffy = "/repo/" + $routeParams.permalink + "/tree/" + $routeParams.branch + "/";
		for (var i = 0; i <= a.length; i++) {
			reffy += "";
			reffy += a[i] + "/";
			if (index == i) {
				break;
			}
		};
		crumby["target"] = reffy;
		crumby["name"] = cur;
		return crumby;
	});
	
	$scope.repo = {
		'permalink': $routeParams.permalink,
		'name': $routeParams.permalink
	}

	TreeService.getTree($routeParams.permalink, $routeParams.branch, $routeParams.blobpath).then(function(tree) {
		$scope.items = tree;
	});

}]);

ctrl.controller('RepositoryCtrl', ['$scope', '$routeParams', 'RepositoryService', function($scope, $routeParams, RepositoryService) {
	//console.log("Hello, world", $routeParams.permalink);
	$scope.items = [];
	$scope.permalink = $routeParams.permalink;
	RepositoryService.getRepoByPermalink($routeParams.permalink).then(function(objs) {
		$scope.message = objs.log[0].message;
		$scope.authored_date = objs.log[0].authored_date;
		$scope.items = objs.log[0].items;
		$scope.meta = objs.meta;
		$scope.latest = objs.meta.latest_commit;
	});
}]);

ctrl.controller('RepositoryListingCtrl', ['$scope', 'RepositoryService', function($scope, RepositoryService) {
	/*$scope.repositories = [
		{
			"name": "Firewatch",
			"description": "Backend for Somanen Web UI and Firebase",
			"permalink": "firewatch"
		},
		{
			"name": "SBS",
			"description": "Joomla-hommia",
			"permalink": "SBS"
		},
		{
			"name": "Somanen Web UI",
			"description": "Somanen web ui using angular",
			"permalink": "somanen"
		}
	];*/
	$scope.repositories = [];
	RepositoryService.getAll().then(function(objs) {
		$scope.repositories = objs;
	});

}]);