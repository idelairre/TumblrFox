module.exports = (function init(Tumblr, Backbone, _) {
  Tumblr.Fox = Tumblr.Fox || {};

  Tumblr.Fox.options = {
    rendered: false,
    logging: true,
    test: false
  };

  const dataReq = new CustomEvent('chrome:initialize', { detail: Tumblr.Prima.currentUser().attributes });
  window.dispatchEvent(dataReq);

  const constReq = new Event('chrome:fetch:constants');
  window.addEventListener('chrome:response:constants', initializeConstants);
  window.dispatchEvent(constReq);

  function initializeConstants(e) {
    const constants = e.detail;
    Tumblr.Fox.options.logging = constants.debug;
    Tumblr.Fox.options.cachedTags = constants.cachedTagsCount !== 0;
    setTimeout(() => {
      window.removeEventListener('chrome:constants:response', initializeConstants);
    }, 1);
  }

  return Tumblr.Fox;
});
