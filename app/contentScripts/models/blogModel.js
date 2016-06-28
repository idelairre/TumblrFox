module.exports = (function blogModel(Tumblr, Backbone, _) {
  const { isArray, take } = _;
  const { $, Model, Collection } = Backbone;
  const { Tumblelog } = Tumblr.Prima.Models;
  const { BlogSource } = Tumblr.Fox.Source;

  const BlogModel = Model.extend({
    defaults: {
      blogname: '',
      next_offset: 0,
      limit: 50
    },
    initialize() {
      this.model = new Model(this.defaults);
      this.posts = new Collection();
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Fox.Events, 'fox:changeUser', ::this.setUser);
    },
    setUser(blogname) {
      this.model.set('blogname', blogname);
    },
    getInfo(blogname) {
      return BlogSource.getInfo(blogname);
    },
    fetch(query) {
      if (query.term.length === 0) {
        return this.filteredFetch(query);
      } else if (query.term.length > 0) {
        return this.search(query);
      }
    },
    fetchAll() {
      const deferred = $.Deferred();
      const recursiveFetch = () => {
        const query = this.model.toJSON();
        return this._fetch(query).then(response => {
          if (response.length !== 0) {
            this.posts.add(response);
            this.model.set('next_offset', query.next_offset + query.limit);
            return recursiveFetch();
          } else {
            deferred.resolve(this.posts);
          }
        });
      }
      recursiveFetch(posts);
      return deferred.promise();
    },
    search(query) {
      return BlogSource.search(query).then(data => {
        Tumblr.Fox.Events.trigger('fox:blogSearch:update', data.response.posts);
        return data.response.posts;
      });
    },
    // TODO: delegate this to the posts collection, model this after the search model and render the first 10 from
    // async fetch, keep fetching, then render the rest from the collection
    filteredFetch(query) {
      let posts = [];
      const deferred = $.Deferred();
      const filteredFetch = () => {
        return this._fetch(query).then(response => {
          return this._applyFilters(query, response); // NOTE: remember that this takes two arguments
        });
      }
      const recursiveFetch = posts => {
        return filteredFetch().then(response => {
          posts = take(posts.concat(response), query.limit);
          if (posts.length < query.limit) {
            query.next_offset += 15;
            return recursiveFetch(posts);
          } else {
            deferred.resolve({ posts, query });
          }
        });
      }
      recursiveFetch(posts);
      return deferred.promise();
    },
    _fetch(query) {
      return BlogSource.fetch(query).then(data => {
        if (data.response.tumblelog && !Tumblelog.collection.get(data.response.tumblelog.name)) {
          Tumblelog.collection.add(new Tumblelog(data.response.tumblelog));
        }
        return data.response.posts;
      });
    },
    _applyFilters(query, posts) {
      if (query.post_role === 'ORIGINAL') {
        posts = posts.filter(post => {
          if (post.hasOwnProperty('is_reblog') && post['is_reblog'] || post.hasOwnProperty('reblogged_from_name')) {
            return;
          }
          return post;
        });
      }
      if (query.filter_nsfw) {
        posts = posts.filter(post => {
          if (!post.hasOwnProperty('tumblelog-content-rating')) {
            return post;
          }
        });
      }
      return posts;
    }
  });

  Tumblr.Fox.register('BlogModel', BlogModel);
});
