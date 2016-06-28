module.exports = (function postsListener(Tumblr, Backbone, _) {
  const { extend } = _;
  const { get } = Tumblr.Fox;

  const PostsListener = function () {
    this.nsfwBlogs = {};
    this.listenTo(Tumblr.Fox, 'initialize:dependency:chromeMixin', this.initialize);
  };

  extend(PostsListener.prototype, Backbone.Events, {
    initialize(ChromeMixin) {
      ChromeMixin.applyTo(PostsListener.prototype);
      this.stopListening(Tumblr.Fox, 'initialize:dependency:chromeMixin');
      this.bindEvents();
    },
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

  Tumblr.Fox.register('PostsListener', PostsListener);
});
