'use strict';

angular.module('snapplrApp')
    .run(function ($rootScope, $log, StarredFeatures) {
        $rootScope.currentUser = Userbin.user();
        $log.info("User:", Userbin.user());
        Userbin.on('login.success login.error logout.success', function () {
            $rootScope.currentUser = Userbin.user();
            $rootScope.$apply()
        });
        Userbin.on('login.success logout.success', StarredFeatures.get)

    })
    .config(function ($httpProvider, $windowProvider) {
        var encoded = window.btoa("snapplr" + ':' + "zki1hvIvPp491lDzvmiV");
//        var neo4j_auth_config = {
//            headers: {
//                Authorization: "Basic " + encoded
//            }
//        };
        $httpProvider.defaults.headers.common = {
            Authorization: "Basic " + encoded
        };
    })
    .controller('MainCtrl', function ($scope, $log, $http, mapFactory, StarredFeatures) {
        $scope.$log = $log;
        $scope.$http = $http;
        $scope.starredFeatures = StarredFeatures.get();
        $scope.$watch('starredFeatures', function (value) {
            $log.info("new features", $scope.starredFeatures);
        });
        $scope.reset = function () {
            StarredFeatures.clear()
        }
    }
)
    .
    directive('leaflet', function (mapFactory, $window, $http, $log, StarredFeatures) {
        var base_neo4j_url = 'http://snapplr.sb01.stations.graphenedb.com:24789/db/data/';
//        var base_neo4j_url = 'http://127.0.0.1:7474/db/data/';
        var neo4j_cypher = base_neo4j_url + 'cypher';
        var neo4j_distance = base_neo4j_url + 'ext/SpatialPlugin/graphdb/findClosestGeometries';
        return {
            restrict: 'A',
            link: function ($scope, elem, attrs) {
                var $log = $scope.$log;
                var $http = $scope.$http;
                mapFactory.setMap(L.map(elem[0]).setView([55.61, 13.00], 16));
                mapFactory.setJQuery($);
                var APIKEY = '25eefd22fc3a4f58b056285afbec54dc';
                var map = mapFactory.getMap();
                L.tileLayer('http://{s}.tile.cloudmade.com/' + APIKEY + '/112595/256/{z}/{x}/{y}.png', {
                    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
                    maxZoom: 18
                }).addTo(map);
                L.grid().addTo(map);
                map.on("click", function (e) {
                    $scope.isLoading = 0;
                    var latlng = e.latlng;
                    var circle = L.circle([latlng.lat, latlng.lng], 10, {
                        color: 'red',
                        fillColor: '#f03',
                        fillOpacity: 0.5
                    }).addTo(mapFactory.getMap());
                    $scope.isLoading++;
                    $scope.$apply();
                    $http.post(neo4j_distance, {
                        layer: "malmo_small_map.osm",
                        pointX: latlng.lng,
                        pointY: latlng.lat,
                        distanceInKm: 0.0005
                    }).then(function (response) {
                            $scope.isLoading--;
                            if (response.data.length == 0) {
                                alert("no features found");
                                return;
                            }
                            var defaultStyleBuilding = {
                                color: "#2262CC",
                                weight: 2,
                                opacity: 0.6,
                                fillOpacity: 0.1,
                                fillColor: "#2262CC"
                            };
                            var defaultStyleHighway = {
                                color: "#00FF00",
                                weight: 3,
                                opacity: 0.6,
                                fillOpacity: 0.1,
                                fillColor: "#2262CC"
                            };
                            var highlightStyle = {
                                color: '#FF0000',
                                weight: 3,
                                opacity: 0.6,
                                fillOpacity: 0.65,
                                fillColor: '#2262CC'
                            };
                            var favStyle = {
                                color: '#FFFFFF',
                                weight: 3,
                                opacity: 0.6,
                                fillOpacity: 0.65,
                                fillColor: '#2262CC'
                            };
                            for (var i = 0; i < response.data.length; i++) {
                                var feature = response.data[i].self.substr(response.data[0].self.lastIndexOf('/') + 1);
                                var cypher = "start n=node(" + feature + ") match n<-[:GEOM]-feature-[:FIRST_NODE]->first-[:NEXT*..]->next-[:NODE]->osm_node,  feature-[:TAGS]->tags where tags.name IS NOT NULL return id(feature) as feature_id,osm_node.lat,osm_node.lon, tags.name? as name, tags.highway? as highway, tags, feature";
//                              $log.info(cypher);
                                var $ = mapFactory.getJQuery();
                                $scope.isLoading++;
                                $http.post(neo4j_cypher, {
                                    query: cypher,
                                    params: {id: feature}
                                }).then(function (res) {
                                        $scope.isLoading--;
                                        var data = res.data.data;
                                        var map = mapFactory.getMap();
                                        var polygonData = [];
                                        if (data.length > 0) {
                                            var featureId = data[0][0];
                                            var name = data[0][3];
                                            var highway = data[0][4];
                                            for (var i = 0; i < data.length; i++) {
                                                polygonData.push([data[i][1], data[i][2]])
                                            }
                                            var polygon = L.polygon(polygonData, defaultStyleBuilding);
//                                            $log.info("highway", name, highway, data);
                                            if (highway) {
                                                polygon = L.polyline(polygonData, defaultStyleHighway);
                                            }
                                            var feature_id_name = "feature_id";
                                            angular.element(polygon).attr(feature_id_name, featureId);
                                            var layer = map.addLayer(polygon);
                                            polygon.on("click", function (e) {
//                                                e.stopPropagation();
                                                var featureId = e.target.feature_id;
                                                $log.info("saving", $scope.starredFeatures);
                                                StarredFeatures.set(featureId, name);

                                            });
                                            polygon.on("mouseover", function (e) {
                                                var style = e.target.options;
                                                e.target.setStyle(highlightStyle);
                                                var popup = angular.element("#details");
                                                popup.html("Name " + ": " + name + "<br/>ID: " + angular.element(polygon).attr(feature_id_name));
                                                if ($scope.starredFeatures[featureId]) {
                                                    popup.append("<br><i class='fa fa-star'></i> starred ");
                                                }
                                                polygon.on("mouseout", function (e) {
                                                    e.target.setStyle(style);
                                                });
                                            });

                                        }
                                    }, function () {
                                        $scope.isLoading--;
                                    }
                                )
                            }
                        })
                })
            }
        }
    })
    .
    factory('mapFactory', function () {
        var map = null;
        var jq = null;

        return {
            setMap: function (mapRef) {
                map = mapRef;
            },
            getMap: function () {
                return map;
            },
            setJQuery: function (jqRef) {
                jq = jqRef;
            },
            getJQuery: function () {
                return jq;
            }
        };
    })
