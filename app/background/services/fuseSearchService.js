import { Deferred } from 'jquery';
import { keyBy } from 'lodash';
import db from '../lib/db';
import EventEmitter from 'eventemitter3';
import Fuse from '../lib/fuse';
import constants from '../constants';
import 'babel-polyfill';

// TODO: add weights

const POST_KEYS = ['summary', 'blogname', 'blog_name', 'tumblelog', 'title', 'body', 'description', 'caption', 'question', 'answer', 'text', 'tags'];

class FuseSearch extends EventEmitter {
  options = {
    caseSensitive: false,
    include: ['score', 'matches'],
    includeScore: true,
    shouldSort: true,
    tokenize: true,
    threshold: 0.5,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    keys: POST_KEYS,
    id: 'id'
  }
  constructor() {
    super();
    this.initialized = false;
    this.posts = [];
    this.fuse = {};
    this.on('ready', () => {
      this.initialized = true;
    });
  }

  setCollection(posts) {
    this.posts = keyBy(posts, 'id');
    this.fuse = new Fuse(posts, this.options);
    this.emit('ready');
  }

  setMatches(matches) {
    this.$$matches = matches;
  }

  getMatches() {
    return this.$$matches;
  }

  fetchMatches(query) {
    return this.$$matches.slice(query.next_offset, query.next_offset + query.limit);
  }

  _search(query) {
    const results = this.fuse.search(query.term);
    console.log('[RESULTS]', results.length);
    for (let i = 0; results.length > i; i += 1) {
      const result = results[i];
      this.$$matches.push(this.posts[result.item]);
    }
    return this.$$matches;
  }

  async search(query) {
    const deferred = Deferred();
    try {
      this.$$matches = [];
      if (this.initialized) {
        const posts = this._search(query);
        return deferred.resolve(posts);
      }
      this.on('ready', () => {
        const posts = this._search(query);
        deferred.resolve(posts);
      });
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }
}

const fuseSearch = new FuseSearch();

export default fuseSearch;
