module.exports = (function postsListener(Tumblr, Backbone, _, ChromeMixin, Listener) {
  const PostsListener = Listener.extend({
    mixins: [ChromeMixin],
    initialize() {
      this.nsfwBlogs = {};
      this.bindEvents();
    },
    bindEvents() {
      this.listenToOnce(Tumblr.Fox.Events, 'chrome:bridge:initialized', ::this.fetchNsfwBlogs);
    },
    fetchNsfwBlogs() {
      this.chromeTrigger('chrome:fetch:nsfwBlogs', response => {
        this.nsfwBlogs = response;
      });
    }
  });

  Tumblr.Fox.register('PostsListener', PostsListener);

});
