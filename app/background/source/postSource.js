import async from 'async';
import constants from '../constants';
import { Deferred } from 'jquery';
import { oauthRequest } from '../lib/oauthRequest';
import Source from './source';
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
}
