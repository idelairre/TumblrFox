import $ from 'jquery';
import { compact, has } from 'lodash';
import BlogSource from '../source/blogSource';

const Filter = {
  applyFilters(query, posts, flagApi) { // NOTE: perhaps there is another way to detect that the post is from the api?
    const deferred = $.Deferred();
    
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
    const deferred = $.Deferred();
    const promises = posts.map(post => {
      return $.Deferred(({ resolve }) => {
        if (has(post, 'tumblelog-content-rating')) {
          const rating = post['tumblelog-content-rating'];
          if (rating === 'nsfw' || rating === 'adult') {
            resolve();
          } else {
            resolve(post);
          }
        } else {
          resolve(post);
        }
      }).promise();
    });

    Promise.all(promises).then(posts => {
      deferred.resolve(compact(posts));
    });

    return deferred.promise();
  },
  _filterNsfwApi(posts) {
    const deferred = $.Deferred();
    const promises = posts.map(post => {
      const name = post.reblogged_from_name || post.reblogged_root_name;
      return $.Deferred(({ resolve, reject }) => {
        if (typeof name === 'undefined') {
          resolve(post);
        } else {
          BlogSource.getContentRating(name).then(response => {
            const { content_rating } = response;

            if (content_rating === 'nsfw') {
              resolve();
            } else {
              resolve(post);
            }
          }).fail(reject);
        }
      }).promise();
    });

    Promise.all(promises).then(response => {
      deferred.resolve(compact(response));
    }).catch(deferred.reject);

    return deferred.promise();
  }
}

module.exports = Filter;
