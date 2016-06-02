module.exports = (function init(Tumblr, Backbone, _) {
  Tumblr.Fox = Tumblr.Fox || {};

  const { assign } = _;

  Tumblr.Fox.options = {
    rendered: false,
    logging: true,
    test: false,
    cachedTags: false,
    enableTextSearch: false
  };

  const dataReq = new CustomEvent('chrome:initialize', {
    detail: Tumblr.Prima.currentUser().attributes
  });

  const initializeConstants = e => {
    const constants = e.detail;
    Tumblr.Fox.options.logging = constants.debug;
    Tumblr.Fox.options.cachedTags = constants.cachedTagsCount !== 0;
    Tumblr.Fox.options.enableTextSearch = constants.fullTextSearch;
    console.log('[BACKEND CONSTANTS]:', constants)
    console.log('[TUMBLRFOX OPTIONS]', Tumblr.Fox.options);
    setTimeout(() => {
      window.removeEventListener('chrome:constants:response', initializeConstants);
    }, 1);
  }

  window.dispatchEvent(dataReq);

  const constReq = new Event('chrome:fetch:constants');
  window.addEventListener('chrome:response:constants', initializeConstants);
  window.dispatchEvent(constReq);

  return Tumblr.Fox;
});
