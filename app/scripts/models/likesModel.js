module.exports = (function likeModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { chromeMixin } = Tumblr.Fox;

  const Likes = Backbone.Model.extend({
    mixins: [chromeMixin],
    initialize() {
      if (window.location.href.includes('https://www.tumblr.com/likes')) {
        console.log('@likes');
        this.listenTo(Tumblr.Events, 'postsView:createPost', ::this.sendLike);
      }
      this.listenTo(Tumblr.Events, 'post:like:set', this.updateLikesCache.bind(this, 'like'));
      this.listenTo(Tumblr.Events, 'post:unlike:set', this.updateLikesCache.bind(this, 'unlike'));
    },
    sendLike(post) {
      const slug = {
        id: $(post.el).data('id'),
        html: $(post.el).prop('outerHTML')
      };
      // console.log('[LIKED POST]', slug);
      this.chromeTrigger('chrome:sync:likes', slug);
    },
    updateLikesCache(action, postId) {
      console.log('[UPDATE LIKES]', action, postId);
      const html = $(`[data-pageable="post_${postId}"]`).html();
      const timestamp = Tumblr.Thoth.get('start_timestamp');
      const slug = {
        postId,
        action,
        html,
        timestamp
      };
      this.chromeTrigger('chrome:update:likes', slug);
    }
  });

  Tumblr.Fox.Likes = new Likes();

  return Tumblr.Fox.Likes;
});
