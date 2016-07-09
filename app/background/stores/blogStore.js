import { forIn, kebabCase, omit } from 'lodash';
import async from 'async';
import db from '../lib/db';
import filters from '../utils/filters';
import sortByPopularity from '../utils/sort';
import marshalQuery from '../utils/marshalQuery';
import Source from '../source/blogSource';
import Tags from './tagStore';
import Lunr from '../services/lunrSearchService';
import { logValues, logError } from '../services/loggingService';
import constants from '../constants';
import 'babel-polyfill';

export default class Blog {
  static async fetch(query) {
    const blogname = query.blogname;
    const _filters = filters.bind(this, omit(marshalQuery(query), 'blogname'));
    let matches = [];
    if (query.post_type || query.post_role === 'ORIGINAL') {
      matches = await db.posts.where('name').equals(blogname).filter(_filters).toArray();
      if (query.sort === 'POPULARITY_DESC') {
        matches = sortByPopularity(matches);
      }
      matches = matches.slice(query.next_offset, query.next_offset + query.limit);
    } else if (!query.post_type && query.sort === 'POPULARITY_DESC') {
      matches = await db.posts.orderBy('note_count').and(post => {
        return post.name === query.blogname;
      }).reverse().toArray();
      matches = matches.slice(query.next_offset, query.next_offset + query.limit);
    } else {
      matches = await db.posts.where('name').equals(blogname).offset(query.next_offset).limit(query.limit).toArray();
    }
    return matches;
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
      post.tags = Tags._updateTags(post);
      post.tokens = Lunr.tokenize(post.html);
      if (!post.hasOwnProperty('note_count') && post.hasOwnProperty('notes')) {
        post.note_count = post.notes.count;
      }
      await db.posts.put(post);
    } catch (e) {
      console.error(e);
    }
  }

  static async bulkPut(posts) {
    try {
      const promises = posts.map(Blog.put);
      Promise.all(promises);
    } catch (e) {
      console.error(e);
    }
  }

  static async cache() {
    const userInfo = await Source.getInfo(constants.get('userName'));
    const totalPosts = userInfo.posts;
    async.doWhilst(async next => {
      try {
        const posts = await Source.start();
        const count = await db.posts.where('name').anyOfIgnoreCase(constants.get('userName')).count();
        await Blog.bulkPut(posts);
        next(null, posts);
      } catch (e) {
        next(e);
      }
    }, posts => {
      return posts.length !== 0 || posts.length === totalPosts;
    });
  }

  static async update() {
    let done = false;
    async.doWhilst(async next => {
      try {
        const posts = await Source.start({
          page: 0
        });
        const promises = posts.filter(testPost => {
          const post = Blog.get(testPost.id);
          if (!post) {
            return Blog.put(testPost);
          } else {
            done = true;
          }
        });
        Promise.all(promises);
        next(null, done);
      } catch (e) {
        next(e);
      }
    }, done => {
      return !done;
    });
  }

  static async validateCache() {
    const userInfo = await Source.getInfo(constants.get('userName'));
    const totalPosts = userInfo.posts;
    const count = await db.posts.where('name').equals(constants.get('userName')).count();
    if (count && count === totalPosts) {
      return true;
    }
    return false;
  }
}
