import { Deferred } from 'jquery';
import { isArray } from 'lodash';
import { oauthRequest } from '../lib/oauthRequest';
import db from '../lib/db';
import sendMessage from '../services/messageService';
import BlogSource from './blogSource';
import 'babel-polyfill';

export default class PostSource {
  static async applyNsfwFilter(posts) {
    return posts.filter(async post => {
      const following = await db.following.get(post.blog_name);
      if ({}.hasOwnProperty.call(following, 'content_rating') && following.content_rating === ('nsfw' || 'adult')) {
        return;
      }
      return post;
    });
  }

  static async fetchDashboardPosts(request) {
    const slug = {
      offset: request.next_offset || 0,
      limit: request.limit,
      url: 'https://api.tumblr.com/v2/user/dashboard'
    };
    if (typeof request.post_type !== 'undefined') {
      slug.type = request.post_type.toLowerCase();
    }
    try {
      const response = await oauthRequest(slug);
      if (request.filter_nsfw && {}.hasOwnProperty.call(response, 'posts')) {
        return await PostSource.applyNsfwFilter(response.posts);
      }
      return response.posts;
    } catch (err) {
      console.error(err);
    }
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
        const posts = await BlogSource.blogRequest(slug);
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
