module.exports = (function chromeListener(Tumblr, Backbone, _, ChromeMixin, Listener) {

  const { clone, omit, pick } = _;

  const ChromeListener = Listener.extend({
    mixins: [ChromeMixin],
    initialize() {
      this.bindEvents();
    },
    bindEvents() {
      window.addEventListener('response', e => {
        const response = e.detail;
        const type = response._type;
        delete response._type;
        Tumblr.Fox.Events.trigger(`chrome:${type}`, response);
      });
    }
  });

  Tumblr.Fox.register('ChromeListener', ChromeListener);

});
