module.exports = (function likeModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign } = _;
  const { chromeMixin, searchOptions } = Tumblr.Fox;

  const LikesModel = Model.extend({
    mixins: [chromeMixin],
    initialize() {
      this.listenTo(Tumblr.Events, 'post:like:set', this.updateLikesCache.bind(this, 'like'));
      this.listenTo(Tumblr.Events, 'post:unlike:set', this.updateLikesCache.bind(this, 'unlike'));
      if (window.location.href.includes('https://www.tumblr.com/likes')) {
        console.log('@likes');
        this.listenTo(Tumblr.Events, 'postsView:createPost', ::this.sendLike);
      }
      console.log('[LIKES]', this);
    },
    fetch(slug) {
      if (searchOptions.get('tag')) {
        return this.fetchLikesByTag(slug)
        } else {
        return this.fetchLikesByTerm(slug)
      }
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
      Tumblr.Events.trigger('fox:autopaginator:start');
      const slug = assign({}, {
        term: query.term,
        post_role: query.post_role,
        post_type: query.post_type,
        sort: query.sort,
        filter_nsfw: query.filter_nsfw,
        before: query.before
      });
      return this.fetch(slug);
    },
    sendLike(post) { // NOTE: major problems: 1. this sends the like while the heart animation is still playing, 2. no timestamp
      const slug = {
        id: $(post.el).data('id'),
        html: $(post.el).prop('outerHTML')
      };
      this.chromeTrigger('chrome:sync:likes', slug);
    },
    updateLikesCache(type, postId) {
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

  Tumblr.Fox.Likes = LikesModel;
});
