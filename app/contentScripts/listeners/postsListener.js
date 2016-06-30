module.exports = (function postsListener(Tumblr, Backbone, _, ChromeMixin, Listener) {
  const PostsListener = Listener.extend({
    mixins: [ChromeMixin],
    initialize() {
      this.nsfwBlogs = {};
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
