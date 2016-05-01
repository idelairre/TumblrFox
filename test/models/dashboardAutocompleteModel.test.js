var assert = require('chai').assert;
var Backbone = require('backbone');
var _ = require('lodash');
var Tumblr = require('../../app/scripts/models/dashboardAutocompleteModel')({}, Backbone, _);

var autoCompleteModel = new Tumblr.Fox.DashboardSearchAutocompleteModel();

describe('dashboardAutocompleteModel', function() {
  describe('#initialize()', function () {
    it('should exist', function () {
      assert.typeOf(AutoCompleteModel.initialize, 'function');
    });
  });
});
