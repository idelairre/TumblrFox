import { isArray, keys, pick, take } from 'lodash';
import { $, Model, Collection } from 'backbone';
import BlogSource from '../../source/blogSource';
import Events from '../../application/events';
import Utils from '../../utils';

const { Tumblelog, Post } = Tumblr.Prima.Models;

const BlogModel = Model.extend({
  defaults: {
    blogname: Tumblr.Prima.currentUser().id,
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
        return this._applyFilters(query, response); // NOTE: remember that this takes two arguments
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
  _applyFilters(query, posts) {
    const deferred = $.Deferred();
    const promises = [];
    if (query.filter_nsfw && query.post_role === 'ORIGINAL') {
      deferred.resolve(this._filterByRole(posts)); // NOTE: currently there is no way to apply both these filters
    } else if (query.filter_nsfw && query.post_role !== 'ORIGINAL') {
      this._filterNsfw(posts).then(filteredPosts => {
        deferred.resolve(filteredPosts);
      })
    } else if (!query.filter_nsfw && query.post_role === 'ORIGINAL') {
      deferred.resolve(this._filterByRole(posts));
    } else {
      deferred.resolve(posts);
    }
    return deferred.promise();
  },
  _filterByRole(posts) {
    return posts.filter(post => {
      if (post.hasOwnProperty('is_reblog') && post['is_reblog'] || post.hasOwnProperty('reblogged_from_name')) {
        return;
      }
      return post;
    });
  },
  _filterNsfw(posts) {
    const when = $.Deferred();
    const promises = posts.map(post => {
      const deferred = $.Deferred();
      const name = post.reblogged_from_name || post.reblogged_root_name
      if (typeof name === 'undefined') {
        deferred.resolve(post);
      } else {
        this.getContentRating(name).then(response => {
          if (response.content_rating === 'nsfw') {
            deferred.resolve();
          } else {
            deferred.resolve(post);
          }
        });
      }
      return deferred.promise();
    });
    $.when.apply($, promises).done((...response) => {
      const filteredPosts = [].concat(...response).filter(post => {
        if (typeof post !== 'undefined') {
          return post;
        }
      });
      when.resolve(filteredPosts);
    });
    return when.promise();
  }
});

module.exports = BlogModel;
