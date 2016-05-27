import $, { Deferred } from 'jquery';
import { flatten, uniq } from 'lodash';
import stripTags from 'striptags';
import BM25 from '../services/BM25';
import db from '../lib/db';
import 'babel-polyfill';

const bm = new BM25();

export default class Keys {
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
    console.log('[SEARCH]', bm, query);
    const deferred = Deferred();
    try {
      const results = await bm.search(query.term);
      deferred.resolve(results);
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }

  static setBlog(tumblelog) {
    bm.setBlog(tumblelog);
  }
}