import { oauthRequest } from '../lib/oauthRequest';
import { ajax, Deferred } from 'jquery';
import { omit } from 'lodash';
import db from '../lib/db';
import sendMessage from '../services/messageService';
import tokens from '../tokens.json';
import 'babel-polyfill';

export default class PostSource {
  static async applyFilter(query, posts) {
    if (query.filter_nsfw) {
      return posts = posts.filter(async post => {
        const following = await db.following.get(post.blog_name);
        if (following && following.hasOwnProperty('content_rating')) {
          console.log('nsfw', post);
          return;
        }
        return post
      });
    }
    return posts;
  }
  static async fetchDashboardPosts(request) {
    const slug = {
      offset: request.next_offset || 0,
      limit: request.limit,
      url: 'https://api.tumblr.com/v2/user/dashboard'
    };
    console.log(slug);
    if (typeof request.post_type !== 'undefined') {
      slug.type = request.post_type.toLowerCase();
    }
    try {
      const response = await oauthRequest(slug)
      const posts = await PostSource.applyFilter(request, response.posts);
      return posts;
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
        deferred.reject(error);
        console.error(error, slug.blogname);
      }
    });
    return deferred.promise();
  }

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
