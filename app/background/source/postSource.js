import { oauthRequest } from '../lib/oauthRequest';
import { ajax } from 'jquery';
import tokens from '../tokens.json';
import 'babel-polyfill';

export default class PostSource {
  static async fetch(request, sender, sendResponse) {
    try {
      const posts = await oauthRequest(request.payload);
      sendResponse(posts);
    } catch (e) {
      console.error(e);
    }
  }

  static async blogFetch(request, sender, sendResponse) {
    console.log('[REQUEST]', request);
    const slug = {
      offset: request.payload.next_offset || 0,
      limit: 12,
      api_key: tokens.consumerKey
    };
    if (typeof request.payload.post_type !== 'undefined') {
      slug.type = request.payload.post_type.toLowerCase();
    }
    let url = `https://api.tumblr.com/v2/blog/${request.payload.blogname}/posts`;
    if (request.payload.post_type) {
      url += `/${slug.type}`;
    }
    ajax({
      type: 'GET',
      url,
      data: slug,
      success: data => {
        sendResponse(data.response);
      },
      error: error => {
        sendResponse(error);
      }
    });
  }
}
