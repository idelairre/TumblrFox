module.exports = (function followerModel(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { chromeMixin } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { currentUser } = Tumblr.Prima;

  const FollowerModel = Backbone.Model.extend({
    defaults: {
      offset: 25,
      limit: 25
    },
    mixins: [chromeMixin],
    initialize(e) {
      this.options = this.defaults;
      this.items = Tumblelog.collection;
      this.$views = []
      this.chromeTrigger('chrome:refresh:following');
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'post:follow:success', () => {
        this.chromeTrigger('chrome:update:following');
      });
    },
    fetch(query) {
      const deferred = $.Deferred();
      if (query === 'orderFollowed') {
        return this.pageFetch(this.options.offset);
      } else {
        this.options.offset = 0; // this is so the page fetch starts at zero when it is selected again
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
          if (this.options.offset === 0) {
            response = response.slice(1, response.length);
          }
          this.options.offset += this.options.limit;
          // $.each(response, (i, value) => {
          //   const tumblelog = new Tumblelog($(response).find('[data-tumblelog-popover]').data('tumblelog-popover'));
          //   console.log(tumblelog);
          //   this.items.add(tumblelog);
          // });
          deferred.resolve(response);
        },
        error: error => {
          console.error(error);
          deferred.reject(error);
        }
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.FollowerModel = FollowerModel;
});
