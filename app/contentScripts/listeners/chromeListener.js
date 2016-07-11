module.exports = (function chromeListener(Tumblr, Backbone, _, ChromeMixin, Listener) {

  const { omit } = _;

  const ChromeListener = Listener.extend({
    mixins: [ChromeMixin],
    initialize() {
      this.bindEvents();
    },
    bindEvents() {
      window.addEventListener('response', e => {
        if (e.detail) {
          Tumblr.Fox.Events.trigger(`chrome:${e.detail._type}`, e.detail);
        } else {
          Tumblr.Fox.Events.trigger(`chrome:${e.detail._type}`);
        }
      });
    }
  });

  Tumblr.Fox.register('ChromeListener', ChromeListener);

});
