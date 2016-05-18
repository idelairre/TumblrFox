module.exports = (function likeModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { chromeMixin, Posts } = Tumblr.Fox;

  const Likes = Backbone.Model.extend({
    mixins: [chromeMixin],
    initialize() {
      this.fetchedLikes = !1;
      if (window.location.href.includes('https://www.tumblr.com/likes')) {
        console.log('@likes');
        this.listenTo(Tumblr.Events, 'postsView:createPost', ::this.sendLike);
      }
      this.listenTo(Tumblr.Events, 'post:like:set', this.updateLikesCache.bind(this, 'like'));
      this.listenTo(Tumblr.Events, 'post:unlike:set', this.updateLikesCache.bind(this, 'unlike'));
    },
    fetchLikesByTag(slug) {
      const deferred = $.Deferred();
      // this.toggleLoader();
      this.resetQueryOffsets();
      slug = Object.assign({
        term: slug.term,
        post_role: slug.post_role,
        post_type: slug.post_type,
        sort: slug.sort,
        filter_nsfw: slug.filter_nsfw,
        before: slug.before
      });
      const resolve = response => {
        Posts.$$matches = response;
        deferred.resolve(response);
        // this.toggleLoader();
      };
      this.chromeTrigger('chrome:search:likes', slug, resolve);
      return deferred.promise();
    },
    searchLikes(query) {
      const deferred = $.Deferred();
      Tumblr.Events.trigger('fox:autopaginator:start');
      this.state.apiFetch = !0;
      this.state.tagSearch = !0;
      this.state.dashboardSearch = !1;
      this.fetchLikesByTag(query).then(matches => {
        Posts.filterPosts();
        setTimeout(() => {
          matches = matches.slice(0, 8);
          Posts.handOffPosts(matches);
          deferred.resolve(matches);
        }, 300);
      });
      return deferred.promise();
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
