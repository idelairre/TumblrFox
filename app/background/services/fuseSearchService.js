import { Deferred } from 'jquery';
import { isEqual, keyBy } from 'lodash';
import db from '../lib/db';
import EventEmitter from 'eventemitter3';
import Fuse from '../lib/fuse';
import constants from '../constants';
import 'babel-polyfill';

const POST_KEYS = ['html', 'tags'];

class FuseSearch extends EventEmitter {
  options = {
    caseSensitive: false,
    include: ['score', 'matches'],
    includeScore: true,
    shouldSort: true,
    tokenize: true,
    threshold: 0.3,
    location: 0,
    distance: 50,
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
    if (isEqual(this.fuse, {})) {
      this.fuse = new Fuse(posts, this.options);
    } else {
      this.fuse.set(posts);
    }
    this.emit('ready');
  }

  setMatches(matches) {
    this.$$matches = matches;
  }

  getMatches() {
    return this.$$matches;
  }

  fetchMatches(query) {
    try {
      return this.$$matches.slice(query.next_offset, query.next_offset + query.limit);
    } catch (e) {
      console.error(e);
    }
  }

  _search(query) {
    const results = this.fuse.search(query.term);
    results.forEach(result => {
      this.$$matches.push(this.posts[result.item]);
    });
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
