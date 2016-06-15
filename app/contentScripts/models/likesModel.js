/* global window:true */

module.exports = (function likeModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, omit } = _;
  const { get, searchOptions } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  const LikesModel = Model.extend({
    mixins: [ChromeMixin],
    initialize(e) {
      this.state = e.state;
      if (window.location.href.includes('https://www.tumblr.com/likes')) {
        console.log('@likes');
        this.listenTo(Tumblr.Events, 'postsView:createPost', ::this.sendLike);
      }
    },
    fetch(slug) {
      if (searchOptions.get('tag')) {
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
      Tumblr.Events.trigger('fox:autopaginator:start');
      let slug = assign({}, { // can change this to 'toJSON' and omit
        blogname: query.blogname,
        term: query.term,
        post_role: query.post_role,
        post_type: query.post_type,
        sort: query.sort,
        filter_nsfw: query.filter_nsfw,
        before: query.before
      });
      if (this.state.get('likes')) {
        slug = omit(slug, 'blogname');
      }
      return this.fetch(slug);
    },
    sendLike(post) {
      const slug = {
        id: $(post.el).data('id'),
        html: $(post.el).prop('outerHTML')
      };
      this.chromeTrigger('chrome:sync:likes', slug);
    }
  });

  Tumblr.Fox.register('LikesModel', LikesModel);
});
