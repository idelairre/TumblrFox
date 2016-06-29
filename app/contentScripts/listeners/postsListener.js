function postsListener(Tumblr, Backbone, _) {
  const { extend } = _;
  const { get } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  const PostsListener = function () {
    this.nsfwBlogs = {};
    this.bindEvents();
  };

  extend(PostsListener.prototype, Backbone.Events, {
    bindEvents() {
      this.listenTo(Tumblr.Events, 'postsView:createPost', ::this.sendPostData);
      this.chromeListenTo('bridge:initialized', ::this.fetchNsfwBlogs);
    },
    sendPostData(post) {
      if (!this.nsfwBlogs[post.model.tumblelog.id] && post.model.get('tumblelog-content-rating') && !post.model.get('is-tumblrfox-post')) {
        this.chromeTrigger('chrome:update:following', post.model.toJSON());
      }
    },
    fetchNsfwBlogs() {
      this.chromeTrigger('chrome:fetch:nsfwBlogs', response => {
        this.nsfwBlogs = response;
      });
    }
  });

  ChromeMixin.applyTo(PostsListener.prototype);

  Tumblr.Fox.register('PostsListener', PostsListener);
}

postsListener.prototype.dependencies = ['ChromeMixin'];

module.exports = postsListener;
