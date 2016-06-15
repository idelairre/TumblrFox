import { oauthRequest } from '../lib/oauthRequest';
import { ajax, Deferred } from 'jquery';
import { omit } from 'lodash';
import db from '../lib/db';
import sendMessage from '../services/messageService';
import tokens from '../tokens.json';
import 'babel-polyfill';

export default class PostSource {
  static async send(request, sender, sendResponse) {
    try {
      const response = await PostSource[request.type](request.payload);
      sendResponse(response);
    } catch (e) {
      console.error(e);
    }
  }

  static async fetchDashboardPosts(request) {
    const slug = {
      offset: request.next_offset || 0,
      limit: request.limit
    };
    if (typeof request.post_type !== 'undefined') {
      slug.type = request.post_type.toLowerCase();
    }
    try {
      return oauthRequest(slug);
    } catch (e) {
      console.error(e);
    }
  }

  static async fetchBlogPosts(request) {
    const slug = {
      blogname: request.blogname,
      offset: request.next_offset || 0,
      limit: 10 || request.limit,
    };
    if (typeof request.post_type !== 'undefined') {
      slug.type = request.post_type.toLowerCase();
    }
    console.log(slug);
    return PostSource._blogRequest(slug);
  }

  static async _blogRequest(slug) {
    const deferred = Deferred();
    let url = `https://api.tumblr.com/v2/blog/${slug.blogname}/posts`;
    if (slug.type) {
      url += `/${slug.type}`;
    }
    url += `?api_key=${tokens.consumerKey}`;

    ajax({
      type: 'GET',
      url,
      data: omit(slug, 'blogname'),
      success: data => {
        deferred.resolve(data.response.posts);
      },
      error: error => {
        deferred.resolve([]);
        console.error(slug.blogname);
      }
    });
    return deferred.promise();
  }

  // 1. fetch most recently updated users
  // 2. fetch 1 post by tag from the first 500 or so users
  // 3. vomit posts

  static async fetchDashboardPostsByTag(query) {
    const deferred = Deferred();
    try {
      const response = [];
      const following = await db.following.orderBy('updated').reverse().toArray();
      const promises = following.map(async follower => {
        const slug = {
          blogname: follower.uuid,
          tag: query.term,
          limit: 1
        };
        if (query.post_type !== 'ANY') {
          slug.type = query.post_type.toLowerCase();
        }
        const posts = await PostSource._blogRequest(slug);
        if (typeof posts[0] !== 'undefined') {
          response.push(posts[0]);
          sendMessage({
            type: 'postFound',
            payload: posts[0]
          });
        }
      });
      await Promise.all(promises);
      deferred.resolve(response);
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }
}
