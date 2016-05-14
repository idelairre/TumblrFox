module.exports = (function init(Tumblr, Backbone, _) {
  Tumblr.Fox = Tumblr.Fox || {};

  Tumblr.Fox.options = {
    rendered: false,
    logging: true,
    test: false
  };

  const dataReq = new CustomEvent('chrome:initialize', { detail: {
    currentUser: Tumblr.Prima.currentUser().id
  }});
  window.dispatchEvent(dataReq);

  const constReq = new Event('chrome:fetch:constants');
  window.addEventListener('chrome:response:constants', initializeConstants);
  window.dispatchEvent(constReq);

  function initializeConstants(e) {
    Tumblr.Fox.options.logging =  e.detail;
    setTimeout(() => {
      window.removeEventListener('chrome:constants:response', initializeConstants);
    }, 1);
  }

  return Tumblr.Fox;
});
