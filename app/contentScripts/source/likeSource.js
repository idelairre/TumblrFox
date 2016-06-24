module.exports = (function likeSource(Tumblr, Backbone, _) {
  const { $ } = Backbone;
  const { extend, omit, pick } = _;
  const { get } = Tumblr.Fox;
  const { currentUser } = Tumblr.Prima;
  const ChromeMixin = get('ChromeMixin');

  const LikeSource = function () { }

  extend(LikeSource.prototype, {
    fetch(slug) {
      if (Tumblr.Fox.options.get('enableTextSearch')) {
        if (slug.term.length === 0) {
          return this.fetchLikesByTag(slug);
        }
        return this.fetchLikesByTerm(slug);
      }
      return this.fetchLikesByTag(slug);
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
        setTimeout(() => {
          deferred.resolve(posts);
        }, 250);
      });
      return deferred.promise();
    }
  });

  ChromeMixin.applyTo(LikeSource.prototype);

  Tumblr.Fox.register('LikeSource', LikeSource);
});
