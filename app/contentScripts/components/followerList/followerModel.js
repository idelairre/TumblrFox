module.exports = (function followerModel(Tumblr, Backbone, _, ChromeMixin) {
  const { $, Model }= Backbone;
  const { assign, pick } = _;
  const { get } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;

  const FollowerModel = Model.extend({
    mixins: [ChromeMixin],
    initialize(options) {
      this.set(pick(options, ['limit', 'offset']));
      this.state = options.state;
      this.items = Tumblelog.collection;
      this.set('loading', false);
    },
    toJSON() {
      return {
        offset: this.get('offset'),
        limit: this.get('limit'),
        order: this.state.getState()
      };
    },
    fetch() {
      const deferred = $.Deferred();
      this.set('loading', true);
      this._fetch().then(followers => {
        if (this.get('offset') === 0) {
          this.items.reset(followers);
        } else {
          followers.forEach(follower => {
            if (!this.items.findWhere({ name: follower.name })) {
              this.items.add(new Tumblelog(follower));
            }
          });
        }
        this.set('offset', this.get('offset') + this.get('limit'));
        this.set('loading', false);
        deferred.resolve(this.items);
      });
      return deferred.promise();
    },
    _fetch() {
      if (this.state.getState() === 'orderFollowed') {
        return this.pageFetch(this.toJSON());
      }
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:following', this.toJSON(), followers => {
        deferred.resolve(followers);
      });
      return deferred.promise();
    },
    pageFetch(query) {
      const deferred = $.Deferred();
      $.ajax({
        type: 'GET',
        url: `https://www.tumblr.com/following/${query.offset}`,
        success: data => {
          const following = Array.prototype.slice.call($(data).find('.follower'));
          const response = [];
          following.forEach(follower => {
            follower = $(follower);
            const json = $(follower).find('[data-tumblelog-popover]').data('tumblelog-popover');
            if (json) {
              json.updated = follower.find('.description').text();
              response.push(json);
            }
          });
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

  Tumblr.Fox.register('FollowerModel', FollowerModel);

});
