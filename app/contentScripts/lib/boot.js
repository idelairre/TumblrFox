module.exports = (function jasmineBoot(jasmineRequire) {
  const extend = (destination, source) => {
    for (const property in source) {
      destination[property] = source[property];
    }
    return destination;
  }

  window.jasmine = jasmineRequire.core(jasmineRequire);

  jasmineRequire.html(jasmine);

  const env = jasmine.getEnv();

  const jasmineInterface = jasmineRequire.interface(jasmine, env);

  extend(window, jasmineInterface);

  const consoleReporter = new jasmineRequire.ConsoleReporter()({
    print() {
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

  const currentWindowOnload = window.onload;

  window.onload = () => {
    if (currentWindowOnload) {
      currentWindowOnload();
    }
  };
});
