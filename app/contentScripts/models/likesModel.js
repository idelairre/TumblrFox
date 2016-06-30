module.exports = (function (Tumblr, Backbone, _, LikeSource) {
  const { Model } = Backbone;

  const LikesModel = Model.extend({
    fetch(query) {
      return LikeSource.fetch(query);
    },
    search(query) {
      return LikeSource.search(query);
    }
  });

  Tumblr.Fox.register('LikesModel', LikesModel);

});
