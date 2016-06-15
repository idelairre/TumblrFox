module.exports = (function likesListener(Tumblr, Backbone, _) {
  const { extend } = _;
  const { ComponentFetcher } = Tumblr.Fox.Utils;

  const LikesListener = function () {
    this.getDependencies();
  };

  extend(LikesListener.prototype, Tumblr.Events, Backbone.Events);

  extend(LikesListener.prototype, {
    getDependencies() {
      this.listenTo(Tumblr.Events, 'fox:components:add', ::this.initialize);
    },
    initialize(name) {
      if (name === 'ChromeMixin') {
        extend(LikesListener.prototype, ComponentFetcher.get('ChromeMixin').properties);
        this.stopListening();
        this.bindEvents();
      }
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'post:like:set', this.updateLikesCache.bind(this, 'like'));
      this.listenTo(Tumblr.Events, 'post:unlike:set', this.updateLikesCache.bind(this, 'unlike'));
    },
    updateLikesCache(type, postId) {
      const slug = {
        postId,
        type
      };
      this.chromeTrigger('chrome:update:likes', slug);
    }
  });

  Tumblr.Fox.register('LikesListener', LikesListener);
});
