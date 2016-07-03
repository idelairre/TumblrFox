module.exports = (function (Tumblr, Backbone, $, _, ChromeMixin, Source) {
  const { currentUser } = Tumblr.Prima;
  const { omit, pick } = _;

  const LikeSource = Source.extend({
    mixins: [ChromeMixin],
    fetch(slug) { // NOTE: this is slightly confusing, fetch is more like a helper method and search is more like fetch
      if (slug.term.length === 0) {
        return this.fetchLikesByTag(slug);
      }
      return this.fetchLikesByTerm(slug);
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
    search(query) {
      const deferred = $.Deferred();
      query = pick(query, 'blogname', 'filter_nsfw', 'limit', 'next_offset', 'post_role', 'post_type', 'sort', 'term');
      if (query.blogname === currentUser().id) {
        query = omit(query, 'blogname');
      }
      this.fetch(query).then(posts => {
        // setTimeout(() => {
          deferred.resolve(posts);
        // }, 250);
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('LikeSource', LikeSource);

});
