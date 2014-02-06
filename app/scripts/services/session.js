'use strict';

angular.module('nodeapp1App')
  .factory('Session', function ($resource) {
    return $resource('/api/session/');
  });
