module.exports = (function listener(Tumblr, Backbone, _, Source) {
  const { extend, isFunction, result } = _;

  const Listener = Source.extend({});

  extend(Listener.prototype, Backbone.Events);

  Tumblr.Fox.register('ListenerClass', Listener);
});
