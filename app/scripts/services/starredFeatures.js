angular.module('snapplrApp')
.service('StarredFeatures', [
  'Storage',
  function(Storage) {
    var STORAGE_KEY = 'snapplr';
    var items = {};
    var starStore = {
      get: function (success, error) {
        var q = Storage.get(STORAGE_KEY);
        q.then(function(response) {
          // Want to keep the reference to the initial items-object at all times
          // Therefore we first delete all the keys and then copy the recieved ones
          for (var key in items) {
            delete items[key];
          }
          angular.extend(items, response);
        });
        return items;
      },
      set: function (key, value) {
        items[key] = value;
        return Storage.set(STORAGE_KEY, items);
      },
      clear: function () {
        // Same as in get method, delete key by key not to destroy reference to items
        for (var key in items) {
            delete items[key];
        }
        return Storage.set(STORAGE_KEY, items);
      }
    }
    return starStore;
  }
]);
