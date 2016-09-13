import { $, Model, Collection } from 'backbone';
import BlogSource from '../../source/blogSource';
import Events from '../../application/events';
import Filters from '../../utils/filtersUtil';
import Utils from '../../utils';

const BlogModel = Model.extend({
  defaults: {
    blogname: Tumblr.Prima.currentUser().id || Tumblr.Fox.options.get('username'),
    cached: false,
    following: false,
    next_offset: 0,
    limit: 10,
    next: true,
    cached_posts: 0,
    total_posts: 0
  },
  initialize() {
    this.set(this.defaults);
    this.bindEvents();
  },
  bindEvents() {
    this.listenTo(Events, 'fox:changeUser', ::this.setUser);
  },
  setUser(blogname) {
    this.set('blogname', blogname);
  },
  getInfo(blogname) {
    return BlogSource.getInfo(blogname);
  },
  getContentRating(blogname) {
    return BlogSource.getContentRating(blogname);
  },
  fetch(query) { // need a way to get newly created user posts after caching
    if (query.blogname === Tumblr.Prima.currentUser().id && Tumblr.Fox.options.get('cachedUserPosts')) {
      return BlogSource.cacheFetch(query);
    }
    if (query.term.length > 0) {
      return this.search(query);
    } else if (query.term.length === 0) {
      return this.filteredFetch(query);
    }
  },
  search(query) {
    return BlogSource.search(query).then(data => {
      return data.response.posts;
    });
  },
  filteredFetch(query) {
    let posts = [];
    const deferred = $.Deferred();
    const filteredFetch = () => {
      return this._fetch(query).then(response => {
        return Filters.applyFilters(query, response, true); // NOTE: remember that this takes two arguments
      });
    }
    const recursiveFetch = posts => {
      return filteredFetch().then(response => {
        posts = posts.concat(response).slice(0, query.limit);
        if (posts.length < query.limit) {
          query.next_offset += 15;
          return recursiveFetch(posts);
        }
        deferred.resolve({
          posts,
          query
        });
      });
    }
    recursiveFetch(posts);
    return deferred.promise();
  },
  _fetch(query) {
    return BlogSource.fetch(query).then(posts => {
      return posts;
    });
  },
});

module.exports = BlogModel;
