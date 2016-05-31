import $, { Deferred } from 'jquery';
import { flatten, uniq } from 'lodash';
import stripTags from 'striptags';
import FuseSearch from '../services/fuseSearch';
import db from '../lib/db';
import 'babel-polyfill';

const fuse = new FuseSearch();

export default class Keys { // NOTE: going to rename this Search really soon
  static async send(request, sender, sendResponse) {
    let response = {};
    if (request.payload) {
      response = await Keys.fetch(request.payload);
    } else {
      response = await Keys.fetch();
    }
    sendResponse(response);
  }

  static async fetch(e) {
    console.log('[QUERY]', e);
    const deferred = Deferred();
    if (e) {
      const keys = await db.terms.where('term').anyOfIgnoreCase(e).toArray();
      deferred.resolve(keys);
    } else {
      const keys = await db.terms.toCollection().toArray();
      deferred.resolve(keys.slice(0, 250));
    }
    return deferred.promise();
  }

  static async search(query) {
    // console.log('[SEARCH]', fuse, query);
    const deferred = Deferred();
    try {
      const results = await fuse.search(query.term);
      deferred.resolve(results);
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static setBlog(tumblelog) {
    fuse.setBlog(tumblelog);
  }
}
