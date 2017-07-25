import { Deferred } from 'jquery';
import { isEmpty } from 'lodash';
import { oauthRequest } from '../lib/oauthRequest';
import filterAsync from '../utils/filterAsync';
import BlogSource from './blogSource';
import constants from '../constants';
import db from '../lib/db';
import sendMessage from '../services/messageService';

export default class PostSource {
  static async filteredFetch(query) {
    let emptyCount = 0;
    const deferred = Deferred();
    const recursiveFetch = async (query, posts = [])  => {
      try {
        const response = await PostSource.fetch(query);
        posts = posts.concat(response).slice(0, query.limit);

        if (posts.length === 0) {
          emptyCount += 1;
        }

        if (emptyCount === 4) {
          return deferred.reject('Returned an empty response more than 3 times');
        } else if (posts.length < query.limit) {
          query.next_offset += 10;
          return recursiveFetch(query, posts);
        } else {
          return deferred.resolve(posts);
        }

      } catch (err) {
        deferred.reject(err);
      }
    }
    return await recursiveFetch(query);
  }

  static applyNsfwFilter(posts = []) { // NOTE: just don't use async/await for this, its weird
  	const filter = post => { // NOTE: filter is synchronous
  		return BlogSource.getInfo(post.blog_name).then(following => {
  			if (following.is_nsfw) {
  				return;
  			}
  			return post;
  		});
  	}
  	return filterAsync(posts, filter).then(response => {
  		return response;
  	});
  }

  static async fetch(request) {
    const deferred = Deferred();
    const slug = {
      offset: request.next_offset || 0,
      limit: request.limit || 10,
      url: 'https://api.tumblr.com/v2/user/dashboard'
    };

    if (typeof request.post_type !== 'undefined') {
      slug.type = request.post_type.toLowerCase();
    }

    try {
      const response = await oauthRequest(slug);

      if (request.filter_nsfw) {
        deferred.resolve(PostSource.applyNsfwFilter(response.posts));
      } else {
        deferred.resolve(response.posts);
      }
    } catch (err) {
      deferred.reject(err);
    }

    return deferred.promise();
  }

  static async fetchDashboardPostsByTag(query) {
    const deferred = Deferred();
    try {
      const response = [];
      const following = await db.following.orderBy('updated').reverse().toArray();
      following.forEach(async follower => {
        const slug = {
          blogname: follower.uuid,
          tag: query.term,
          limit: 1
        };

        if (query.post_type !== 'ANY') {
          slug.type = query.post_type.toLowerCase();
        }

        const posts = await BlogSource.fetchBlogPosts(slug);

        if (typeof posts[0] !== 'undefined') {
          response.push(posts[0]);
          sendMessage({
            type: 'postFound',
            payload: posts[0]
          });
        }
      });
      deferred.resolve(response);
    } catch (err) {
      deferred.reject(err);
    }
    
    return deferred.promise();
  }
}
