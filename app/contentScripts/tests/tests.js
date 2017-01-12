function bootstrap() {

  let didBootstrap = false;

  const loaderObserver = new MutationObserver(initialize.bind(this));

  if (window.Tumblr) {
    Tumblr.Fox.Events.once('tests:load', initialize);
  } else {
    loaderObserver.observe(document, {
      childList: true,
      subtree: true
    });
  }

  function initialize() {
    if (!window.Tumblr || didBootstrap) {
      return;
    }
    require('./models/blogModelSpec');
    require('./models/dashboardModelSpec');
    require('./models/likesModelSpec');
    require('./source/dashboardSourceSpec');

    Tumblr.Fox.Events.trigger('tests:initialize');

    didBootstrap = true;
    loaderObserver.disconnect();
  }
}

if (document.readyState === 'complete') {
  bootstrap();
} else {
  window.addEventListener('load', bootstrap);
}
