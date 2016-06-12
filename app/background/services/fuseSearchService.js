import { Deferred } from 'jquery';
import { keyBy } from 'lodash';
import db from '../lib/db';
import Eventor from '../lib/eventor';
import Fuse from '../lib/fuse';
import constants from '../constants';
import 'babel-polyfill';

// TODO: add weights

const POST_KEYS = ['summary', 'blogname', 'blog_name', 'tumblelog', 'title', 'body', 'description', 'caption', 'question', 'answer', 'text', 'tags'];

class FuseSearch extends Eventor {
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
    constants.addListener('ready', () => {
      if (constants.get('fullTextSearch')) {
        db.posts.toCollection().toArray().then(posts => {
          this.posts = keyBy(posts, 'id');
          this.fuse = new Fuse(posts, this.options);
          this.initialized = true;
          this.trigger('ready');
          console.log('[FUSE]', this.fuse);
        });
      }
    });
  }
  
  async search(query) {
    const deferred = Deferred();
    try {
      const posts = [];
      const results = this.fuse.search(query.term);
      console.log('[RESULTS]', results.length);
      for (let i = 0; results.length > i; i += 1) {
        const result = results[i];
        posts.push(this.posts[result.item]);
      }
      deferred.resolve(posts);
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
  }
}

const fuseSearch = new FuseSearch();

export default fuseSearch;
