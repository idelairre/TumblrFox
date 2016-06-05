module.exports = (function likeModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { assign } = _;
  const { chromeMixin, Posts } = Tumblr.Fox;

  const LikesModel = Backbone.Model.extend({
    mixins: [chromeMixin],
    initialize() {
      this.fetchedLikes = false;
      if (window.location.href.includes('https://www.tumblr.com/likes')) {
        console.log('@likes');
        this.listenTo(Tumblr.Events, 'postsView:createPost', ::this.sendLike);
      }
      this.listenTo(Tumblr.Events, 'post:like:set', this.updateLikesCache.bind(this, 'like'));
      this.listenTo(Tumblr.Events, 'post:unlike:set', this.updateLikesCache.bind(this, 'unlike'));
    },
    fetchLikesByTag(slug) {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:search:likesByTag', slug, deferred.resolve);
      return deferred.promise();
    },
    fetchLikesByTerm(slug) {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:search:likesByTerm', slug, deferred.resolve);
      return deferred.promise();
    },
    search(query) { // TODO: fix this wreck, the setTimeout is to fux a bug with values not being assigned on time
      const deferred = $.Deferred();
      Tumblr.Events.trigger('fox:autopaginator:start');
      Posts.state.apiFetch = true;
      Posts.state.tagSearch = true;
      Posts.state.dashboardSearch = false;
      console.log(query);
      setTimeout(() => {
        const slug = assign({}, {
          term: query.term,
          post_role: query.post_role,
          post_type: query.post_type,
          sort: query.sort,
          filter_nsfw: query.filter_nsfw,
          before: query.before
        });
        Posts.resetQueryOffsets();
        switch (Tumblr.Fox.searchOptions.getState()) {
          case 'tag':
            this.fetchLikesByTag(slug).then(matches => {
              ::this.setMatches(matches);
              deferred.resolve(matches);
            });
            break;
          case 'text':
            this.fetchLikesByTerm(slug).then(matches => {
              ::this.setMatches(matches);
              deferred.resolve(matches);
            });
            break;
        }
      }, 10);
      return deferred.promise();
    },
    sendLike(post) { // NOTE: major problems: 1. this sends the like while the heart animation is still playing, 2. no timestamp
      const slug = {
        id: $(post.el).data('id'),
        html: $(post.el).prop('outerHTML')
      };
      this.chromeTrigger('chrome:sync:likes', slug);
    },
    setMatches(matches) {
      console.log('[MATCHES]', matches);
      Posts.$$matches = matches;
      Posts.filterPosts().then(() => {
        matches = matches.slice(0, 8);
        Posts.handOffPosts(matches);
      });
    },
    updateLikesCache(type, postId) {
      console.log('[UPDATE LIKES]', action, postId);
      const html = $(`[data-pageable="post_${postId}"]`).html();
      // const timestamp = Tumblr.Thoth.get('start_timestamp'); // NOTE: find another way to get a timestamp
      const slug = {
        postId,
        type,
        html
      };
      this.chromeTrigger('chrome:update:likes', slug);
    }
  });

  Tumblr.Fox.Likes = new LikesModel();
});
