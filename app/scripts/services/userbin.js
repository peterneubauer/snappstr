angular.module('userbin', [])
.service('Userbin', [
  '$rootScope',
  function ($rootScope) {
    var ub = window.Userbin;
    if (!ub) throw("The Userbin script hasn't been installed")

    ub.on('login.success logout.success', function(evt) {
      $rootScope.$broadcast('userbin:authenticated', ub.user());
      $rootScope.$digest()
    });

    return {
      user: ub.user,
      login: ub.login,
      auth: ub.auth,
      logout: ub.logout
    }
  }
]);
