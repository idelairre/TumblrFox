module.exports = (function likesListener(Tumblr, Backbone, _, ChromeMixin, Listener) {
  const LikesListener = Listener.extend({
    mixins: [ChromeMixin],
    initialize() {
      this.enabled = false;
      this.listenTo(Tumblr.Events, 'post:like:set', this.sendLike.bind(this, 'like'));
      this.listenTo(Tumblr.Events, 'post:unlike:set', this.sendLike.bind(this, 'unlike'));
      if (Tumblr.Fox.state.get('likes')) {
        this.listenTo(Tumblr.Fox.Events, 'fox:postsView:createPost', ::this.syncLike);
        this.enabled = true;
      }
    },
    sendLike(type, postId) {
      const slug = {
        postId,
        type
      };
      this.chromeTrigger('chrome:update:likes', slug);
    },
    syncLike(postData) {
      if (!postData.model['is-tumblrfox-post']) {
        const post = postData.model;
        post.html = postData.el;
        post.blog_name = post.tumblelog;
        post['is-tumblrfox-post'] = true;
        this.chromeTrigger('chrome:sync:like', post);
      }
    }
  });

  Tumblr.Fox.register('LikesListener', LikesListener);

});
