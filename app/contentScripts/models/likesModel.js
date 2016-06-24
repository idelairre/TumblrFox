module.exports = (function likeModel(Tumblr, Backbone, _) {
  const { Model } = Backbone;
  const { LikeSource } = Tumblr.Fox.Source;

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
