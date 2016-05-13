module.exports = (function followerModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { chromeMixin } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;

  const FollowerModel = Backbone.Model.extend({
    defaults: {
      offset: 0,
      limit: 25
    },
    mixins: [chromeMixin],
    initialize(e) {
      this.options = this.defaults;
      this.items = Tumblelog.collection;
      this.$views = new Backbone.Collection();
      this.chromeTrigger('chrome:update:following');
    },
    fetch(query) {
      // console.log('[QUERY]', query, this);
      const deferred = $.Deferred();
      if (query === 'followed') {
        return this.pageFetch(this.options.offset); // should also be a promise
      } else {
        this.options.offset = 0;
        this.chromeTrigger('chrome:fetch:following', query, followers => {
          deferred.resolve(this.items.reset(followers));
        });
        return deferred.promise();
      }
    },
    pageFetch(offset) {
      const deferred = $.Deferred();
      $.ajax({
        type: 'GET',
        url: `https://www.tumblr.com/following/${offset}`,
        success: data => {
          let response = $(data).find('.follower');
          response = response.slice(1, response.length);
          this.options.offset += this.options.limit;
          this.$views.add(response);
          // console.log('[RESPONSE]', response);
          deferred.resolve(response);
        },
        fail: error => {
          console.error(error);
          deferred.reject(error);
        }
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.FollowerModel = FollowerModel;

  return Tumblr.Fox.FollowerModel;
});
