'use strict';

var baseConfig = require('./karma.config.base');

module.exports = function(config) {
  config.set(Object.assign(baseConfig, {
    autoWatch: true,
    singleRun: false,
    reporters: ['kjhtml'],
    htmlReporter: {
      outputFile: 'report/units.html',
      pageTitle: 'Unit Tests',
      subPageTitle: ''
    }
  }));
};
