import $, { Deferred } from 'jquery';
import { flatten, uniq } from 'lodash';
import stripTags from 'striptags';
import BM25 from '../lib/BM25';
import db from '../lib/db';
import 'babel-polyfill';

const POST_KEYS = ['summary', 'blogname', 'title', 'body', 'description', 'caption', 'question', 'answer', 'text', 'html', 'tags'];

const bm = new BM25();

export default class Keys {
  static _tokenize(key, text) {
    const deferred = Deferred();
    if (text && text.lengh > 0) {
      if (key === 'html') {
        text = stripTags($(text).find('p').text());
      }
      if (key === 'reblog') {
        text = `${text.comment} ${text.tree_html}`;
        text = stripTags($(text).find('p').text());
      }
      const postKeys = BM25.tokenize(text);
      deferred.resolve(postKeys);
    } else {
      deferred.resolve([]);
    }
    return deferred.promise();
  }

  static async parsePost(post) {
    try {
      const keys = Object.keys(post).filter(key => {
        if (POST_KEYS.includes(key)) {
          return key;
        }
      });
      const promises = keys.map(async key => {
        return await Keys._tokenize(key, post[key]);
      });
      const keyArrays = await Promise.all(promises);
      post.keys = uniq(flatten(keyArrays));
      await bm.addDocument(post);
    } catch (e) {
      console.error(e);
    }
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
    console.log('[SEARCH]', bm, query);
    const deferred = Deferred();
    try {
      if (!bm.initialized) {
        bm.addListener('ready', async () => {
          const results = await bm.search(query.term);
          deferred.resolve(results);
        });
      } else {
        const results = await bm.search(query.term);
        deferred.resolve(results);
      }
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }
}
