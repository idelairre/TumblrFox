module.exports = (function init(Tumblr, Backbone, _) {
  Tumblr.Fox = Tumblr.Fox || {};
  const { assign } = _;

  Tumblr.Fox.options = {
    rendered: false,
    logging: true,
    test: false
  };

  const State = Backbone.Model.extend({
    initialize(e) {
      assign(this, e);
    },
    getState() {
      for (const key in this.attributes) {
        if (this.attributes[key]) {
          return key;
        }
      }
    }
  });

  Tumblr.Fox.state = new State({
    dashboard: !1,
    user: !0,
    likes: !1
  });

  Tumblr.Fox.searchOptions = new State({
    tag: !0,
    text: !1
  });

  const dataReq = new CustomEvent('chrome:initialize', {
    detail: Tumblr.Prima.currentUser().attributes
  });
  window.dispatchEvent(dataReq);

  const constReq = new Event('chrome:fetch:constants');
  window.addEventListener('chrome:response:constants', initializeConstants);
  window.dispatchEvent(constReq);

  const initializeConstants = e => {
    console.log('[CONSTANTS]', e);
    const constants = e.detail;
    Tumblr.Fox.options.fullTextSearch = constants.fullTextSearch;
    Tumblr.Fox.options.logging = constants.debug;
    Tumblr.Fox.options.cachedTags = constants.cachedTagsCount !== 0;
    setTimeout(() => {
      window.removeEventListener('chrome:constants:response', initializeConstants);
    }, 1);
  }

  return Tumblr.Fox;
});
