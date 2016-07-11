module.exports = (function followingModel(Tumblr, Backbone, _, FollowingSource) {
  const { $, Model }= Backbone;
  const { assign, isArray, isEmpty, pick, keys } = _;
  const { Tumblelog } = Tumblr.Prima.Models;

  const FollowingModel = Model.extend({
    defaults: {
      offset: 0,
      limit: 25
    },
    initialize(options) {
      assign(this, pick(options, ['state']));
      this.set(pick(options, ['limit', 'offset']));

      if (isEmpty(options)) {
        this.set(this.defaults);
      }

      this.items = Tumblelog.collection;
      this.set('loading', false);
    },
    add(following) {
      if (isArray(following)) {
        following.forEach(follower => {
          new Tumblelog(follower);
        });
      } else {
        new Tumblelog(following);
      }
      Tumblr.Fox.Events.trigger('fox:update:following');
    },
    toJSON() {
      const attributes = {
        offset: this.get('offset'),
        limit: this.get('limit')
      }
      if (this.hasOwnProperty('state')) {
        attributes.order = this.state.getState();
      }
      return attributes;
    },
    fetch() {
      const deferred = $.Deferred();
      this.set('loading', true);
      this._fetch().then(followings => {
        if (Tumblr.Fox.route.includes('following') && this.get('offset') === 0) {
          this.items.reset(followings);
        } else {
          followings.forEach(following => {
            if (!this.items.findWhere({ name: following.name })) {
              this.items.add(new Tumblelog(following));
            }
          });
        }
        this.set('offset', this.get('offset') + this.get('limit'));
        this.set('loading', false);
        deferred.resolve(this.items);
      });
      return deferred.promise();
    },
    fetchAll() {
      return FollowingSource.fetch().then(following => {
        this.items.reset(following);
        Tumblr.Fox.Events.trigger('fox:update:following');
      });
    },
    _fetch() {
      if (this.hasOwnProperty('state') && this.state.get('orderFollowed')) {
        return FollowingSource.pageFetch(this.toJSON());
      }
      return FollowingSource.fetch(this.toJSON());
    }
  });

  Tumblr.Fox.register('FollowingModel', FollowingModel);

});
