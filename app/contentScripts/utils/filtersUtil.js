import $ from 'jquery';
import { has } from 'lodash';
import BlogSource from '../source/blogSource';

const Filter = {
  applyFilters(query, posts, flagApi) {
    const deferred = $.Deferred();
    const promises = [];
    if (query.filter_nsfw && query.post_role === 'ORIGINAL') {
      if (flagApi) {
        this._filterNsfwApi(posts).then(this._filterByRole).then(deferred.resolve);
      } else {
        this._filterNsfwClient(posts).then(this._filterByRole).then(deferred.resolve);
      }
    } else if (query.filter_nsfw && query.post_role !== 'ORIGINAL') {
      if (flagApi) {
        this._filterNsfwApi(posts).then(deferred.resolve);
      } else {
        this._filterNsfwClient(posts).then(deferred.resolve);
      }
    } else if (!query.filter_nsfw && query.post_role === 'ORIGINAL') {
      deferred.resolve(this._filterByRole(posts));
    } else {
      deferred.resolve(posts);
    }
    return deferred.promise();
  },
  _filterByRole(posts) {
    return posts.filter(post => {
      if (post['is_reblog'] || post['reblogged_from_name']) {
        return;
      }
      return post;
    });
  },
  _filterNsfwClient(posts) {
    const when = $.Deferred();
    const promises = posts.map(post => {
      const deferred = $.Deferred();
      if (has(post, 'tumblelog-content-rating')) {
        const rating = post['tumblelog-content-rating'];
        if (rating === 'nsfw' || rating === 'adult') {
          deferred.resolve();
        } else {
          deferred.resolve(post);
        }
      } else {
        deferred.resolve(post);
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
  },
  _filterNsfwApi(posts) {
    const when = $.Deferred();
    const promises = posts.map(post => {
      const deferred = $.Deferred();
      const name = post.reblogged_from_name || post.reblogged_root_name;
      if (typeof name === 'undefined') {
        deferred.resolve(post);
      } else {
        BlogSource.getContentRating(name).then(response => {
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
}

module.exports = Filter;
