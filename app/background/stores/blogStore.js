import { forIn, isFunction, kebabCase, omit, noop } from 'lodash';
import async from 'async';
import db from '../lib/db';
import filters from '../utils/filters';
import sortByPopularity from '../utils/sort';
import marshalQuery from '../utils/marshalQuery';
import { noopCallback } from '../utils/helpers';
import Source from '../source/blogSource';
import Tags from './tagStore';
import Lunr from '../services/lunrSearchService';
import { logValues, logError } from '../services/loggingService';
import constants from '../constants';
import 'babel-polyfill';

// TODO: make sure Source can fetch all the user's blog posts

let caching = false; // NOTE: this is temporary, might have to actually instansiate the class

export default class Blog {
  static async fetch(query) {
    try {
      const blogname = query.blogname;
      const _filters = filters.bind(this, omit(marshalQuery(query), 'blogname'));
      if (query.post_type && query.post_role === 'ORIGINAL') {
        let matches = await db.posts.where('type').equals(query.post_type).filter(post => {
          return !post.is_reblog;
        }).reverse().toArray();
        if (query.sort === 'POPULARITY_DESC') {
          matches = sortByPopularity(matches);
        }
        return matches.slice(query.next_offset, query.next_offset + query.limit);
      }
      if (query.post_type && query.post_role !== 'ORIGINAL') {
        let matches = await db.posts.where('type').equals(query.post_type).reverse().toArray();
        if (query.sort === 'POPULARITY_DESC') {
          matches = sortByPopularity(matches);
        }
        return matches.slice(query.next_offset, query.next_offset + query.limit);
      }
      if (query.post_role === 'ORIGINAL' && query.sort !== 'POPULARITY_DESC') {
        let matches = await db.posts.toCollection().filter(post => {
          return !post.is_reblog;
        }).reverse().toArray();
        return matches.slice(query.next_offset, query.next_offset + query.limit);
      }
      if (query.post_role !== 'ORIGINAL' && query.sort === 'POPULARITY_DESC') {
        return await db.posts.orderBy('note_count').reverse().offset(query.next_offset).limit(query.limit).toArray();
      }
      return await db.posts.orderBy('order').reverse().offset(query.next_offset).limit(query.limit).toArray();
    } catch (e) {
      console.error(e);
      return e;
    }
  }

  static async get(id) {
    try {
      return await db.posts.get(id);
    } catch (e) {
      console.error(e);
    }
  }

  static async put(post) {
    try {
      let count = await db.posts.toCollection().count();
      post.order = count + 1;
      post.tokens = Lunr.tokenize(post.html);
      if (!post.hasOwnProperty('note_count') && post.hasOwnProperty('notes')) {
        post.note_count = post.notes.count;
      }
      await db.posts.put(post);
      count = await db.posts.toCollection().count();
      constants.set('cachedPostsCount', count);
    } catch (e) {
      console.error(e);
    }
  }

  static async bulkPut(posts) {
    try {
      const promises = posts.map(Blog.put);
      return Promise.all(promises);
    } catch (e) {
      console.error(e);
    }
  }

  static async cache(sendResponse) {
    if (caching) {
      return;
    }
    caching = true;
    const sendProgress = isFunction(sendResponse) ? logValues.bind(this, 'posts', sendResponse) : noopCallback;
    const sendError = isFunction(sendResponse) ? logError : noop;
    Source.addListener('items', async posts => {
      await Blog.bulkPut(posts);
      Source.next();
      sendProgress();
    });
    Source.addListener('error', err => {
      sendError(err, sendResponse);
    });
    Source.addListener('done', msg => {
      if (isFunction(sendResponse)) {
        sendResponse({
          type: 'done',
          payload: constants,
          message: msg
        });
      }
      Source.removeListeners();
    });
    Source.start();
  }

  static async update() {
    if (caching) {
      return;
    }
    let done = false;
    Source.addListener('items', posts => {
      try {
        const promises = posts.map(testPost => {
          const post = Blog.get(testPost.id);
          if (!post) {
            return Blog.put(testPost);
          } else {
            done = true;
          }
        });
        Promise.all(promises);
      } catch (e) {
        console.error(e);
      }
    });
    Source.addListener('error', err => {
      console.error(err);
    });
    Source.addListener('done', msg => {
      Source.removeListeners();
    });
    Source.start();
  }

  static async validateCache() {
    const userInfo = await Source.getInfo(constants.get('userName'));
    const totalPosts = userInfo.posts;
    const count = await db.posts.where('blog_name').equals(constants.get('userName')).count();
    if (count && count === totalPosts) {
      return true;
    }
    return false;
  }
}
