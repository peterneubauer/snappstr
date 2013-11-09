angular.module('snapplrApp')
.service('Storage', [
  '$q', '$rootScope', 'Userbin',
  function($q, $rootScope, Userbin) {
    var dummyAdapter = {
      get: function() {
        var dfd = $q.defer();
        dfd.resolve([]);
        return dfd.promise;
      },
      set: function() {
        var dfd = $q.defer();
        dfd.resolve();
        return dfd.promise;
      }
    };
    var userbinAdapter = {
      get: function(key) {
        var dfd = $q.defer();
        Userbin.user().get().then(function(data) {
          dfd.resolve(data[key]);
          $rootScope.$apply();
        });
        return dfd.promise;
      },
      set: function(key, value) {
        var dfd = $q.defer();
        Userbin.user().set(key, value).then(function() {
          dfd.resolve();
          $rootScope.$apply();
        });
        return dfd.promise;
      }
    };
    return {
      get: function() {
        return (Userbin.user() ? userbinAdapter : dummyAdapter).get.apply(null, arguments);
      },
      set: function() {
        return (Userbin.user() ? userbinAdapter : dummyAdapter).set.apply(null, arguments);
      }
    };
  }
]);
