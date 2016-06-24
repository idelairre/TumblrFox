module.exports = (function dashboardSource(Tumblr, Backbone, _) {
  const { $ } = Backbone;
  const { extend, omit, pick } = _;
  const { get } = Tumblr.Fox;
  const { BlogSource } = Tumblr.Fox.Source;
  const ChromeMixin = get('ChromeMixin');

  const DashboardSource = function () { };

  extend(DashboardSource.prototype, {
    fetch(query) {
      const deferred = $.Deferred();
      let slug = pick(query, 'next_offset', 'filter_nsfw', 'limit', 'post_type', 'post_role', 'sort');
      if (query.post_type === 'ANY') {
        slug = omit(slug, 'post_type');
      }
      this.chromeTrigger('chrome:fetch:dashboardPosts', slug, response => {
        BlogSource.collateData(response).then(response => {
          const results = [];
          response.forEach(item => {
            results.push(item.response.posts[0]);
          });
          deferred.resolve(results);
        });
      });
      return deferred.promise();
    },
    search(query) {
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:following', query, followers => {
        followers = followers.slice(0, 200);
        const promises = followers.map(follower => {
          query.blogname = follower.name;
          query.limit = 1;
          return BlogSource.search(query).then(data => {
            if (data.response.posts.length > 0) {
              Tumblr.Fox.Events.trigger('fox:search:postFound', data.response.posts[0]);
            }
            return data;
          });
        });
        $.when.apply($, promises).done((...posts) => {
          const results = [].concat(...posts);
          deferred.resolve(results);
        });
      });
      return deferred.promise();
    }
  });

  ChromeMixin.applyTo(DashboardSource.prototype);

  Tumblr.Fox.register('DashboardSource', DashboardSource);
});
