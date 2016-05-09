module.exports = (function followerModel() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { chromeMixin } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;

  let FollowerModel = Backbone.Model.extend({
    mixins: [chromeMixin],
    initialize(e) {
      this.items = Tumblelog.collection;
    },
    fetch() {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:following', followers => {
        deferred.resolve(this.items.reset(followers));
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.FollowerModel = FollowerModel;

  return Tumblr.Fox.FollowerModel;
})
