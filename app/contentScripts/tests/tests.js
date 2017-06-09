// NOTE: this is stupid because it needs to wait for the 'load' event but it can't have access until
// the Tumblr.Fox.Events object is loaded. Waiting for the dom to change doesn't really do anything because
// that tells the function nothing about whether or not the 'Events' object is actually loaded.
// by the time the dom is ready it is likely 'tests:load' has already been triggered and there is no
// listener to handle the event

// NOTE: this is called in two different contexts. The if catches are meant to ensure that these functions
// only run if Tumblr is in the window and we are in the context of the webpage and not the chrome extension

function bootstrap() {
  if (!window.Tumblr) {
    return;
  }

  define('tests', ['script!./jasmine/jasmine', 'script!./jasmine/jasmine-html', 'script!./jasmine/boot'], function() {
    require('./models/blogModelSpec');
    require('./models/dashboardModelSpec');
    require('./models/likesModelSpec');
    require('./source/dashboardSourceSpec');
    require('./source/blogSourceSpec');
  });

  require(['tests'], function () {
    Tumblr.Fox.Events.trigger('tests:initialize');
  });
}

window.addEventListener('testsReady', bootstrap);
