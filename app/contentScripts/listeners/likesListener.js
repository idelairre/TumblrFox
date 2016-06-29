function likesListener(Tumblr, Backbone, _) {
  const { extend } = _;
  const { get } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  const LikesListener = function () {
    this.listenTo(Tumblr.Fox, 'initialize:dependency:stateModel', this.syncLikes);
    this.initialize();
  };

  extend(LikesListener.prototype, Backbone.Events, {
    initialize() {
      this.listenTo(Tumblr.Events, 'post:like:set', this.sendLike.bind(this, 'like'));
      this.listenTo(Tumblr.Events, 'post:unlike:set', this.sendLike.bind(this, 'unlike'));

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

  ChromeMixin.applyTo(LikesListener.prototype);

  Tumblr.Fox.register('LikesListener', LikesListener);
}

likesListener.prototype.dependencies = ['ChromeMixin', 'StateModel'];

module.exports = likesListener
