module.exports = (function(jasmineRequire) {
  window.jasmine = jasmineRequire.core(jasmineRequire);

  jasmineRequire.html(jasmine);

  var env = jasmine.getEnv();

  var jasmineInterface = jasmineRequire.interface(jasmine, env);

  extend(window, jasmineInterface);

  var consoleReporter = new jasmineRequire.ConsoleReporter()({
    print: function () {
      console.log.apply(console, arguments);
    },
    showColors: true
  });

  env.addReporter(jasmineInterface.jsApiReporter);
  // env.addReporter(consoleReporter);

  window.setTimeout = window.setTimeout;
  window.setInterval = window.setInterval;
  window.clearTimeout = window.clearTimeout;
  window.clearInterval = window.clearInterval;

  var currentWindowOnload = window.onload;

  window.onload = function() {
    if (currentWindowOnload) {
      currentWindowOnload();
    }
  };

  function extend(destination, source) {
    for (var property in source) destination[property] = source[property];
    return destination;
  }

});
