module.exports = (function likesListener(Tumblr, Backbone, _) {
  const { extend } = _;
  const { get } = Tumblr.Fox;

  const LikesListener = function () {
    this.listenTo(Tumblr.Fox, 'initialize:dependency:chromeMixin', this.initialize);
    this.listenTo(Tumblr.Fox, 'initialize:dependency:stateModel', this.syncLikes);
  };

  extend(LikesListener.prototype, Backbone.Events, {
    initialize(ChromeMixin) {
      ChromeMixin.applyTo(LikesListener.prototype);
      this.listenTo(Tumblr.Events, 'post:like:set', this.sendLike.bind(this, 'like'));
      this.listenTo(Tumblr.Events, 'post:unlike:set', this.sendLike.bind(this, 'unlike'));

      this.stopListening(Tumblr.Fox, 'initialize:dependency:chromeMixin');
    },
    sendLike(type, postId) {
      const slug = {
        postId,
        type
      };
      this.chromeTrigger('chrome:update:likes', slug);
    },
    syncLike(postData) {
      if (!postData.model.get('is-tumblrfox-post')) {
        const post = postData.model.toJSON();
        post.html = postData.el;
        post.blog_name = post.tumblelog;
        post['is-tumblrfox-post'] = true;
        this.chromeTrigger('chrome:sync:like', post);
      }
    },
    syncLikes() {
      if (Tumblr.Fox.state.get('likes')) {
        this.listenTo(Tumblr.Fox.Events, 'fox:postsView:createPost', ::this.syncLike);
      }
    }
  });

  Tumblr.Fox.register('LikesListener', LikesListener);
});
