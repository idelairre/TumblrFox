module.exports = (function blogModel(Tumblr, Backbone, _) {
  const { isArray } = _;
  const { $, Model } = Backbone;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { BlogSource } = Tumblr.Fox.Source;

  const BlogModel = Model.extend({
    getInfo(blogname) {
      return BlogSource.getInfo(blogname);
    },
    fetch(query) {
      if (query.term.length === 0) {
        return this._fetch(query);
      } else if (query.term.length > 0) {
        return this.search(query);
      }
    },
    search(query) {
      return BlogSource.search(query).then(data => {
        Tumblr.Fox.Events.trigger('fox:blogSearch:update', data.response.posts);
        return data.response.posts;
      });
    },
    _fetch(slug) {
      return BlogSource.fetch(slug).then(data => {
        if (isArray(data)) {
          return this._handleCollatedData(data);
        }
        return data.response.posts;
      });
    },
    _handleCollatedData(data) {
      const results = [];
      data.forEach(item => {
        const { posts, tumblelog } = item.response;
        results.push(posts[0]);
        Tumblelog.collection.add(tumblelog);
      });
      return results;
    }
  });

  Tumblr.Fox.register('BlogModel', BlogModel);
});
