import { Deferred } from 'jquery';
import { isNumber, words, keyBy, union } from 'lodash';
import constants from '../constants';
import db from '../lib/db';
import Fuse from '../lib/fuse';
import 'babel-polyfill';

const POST_KEYS = ['summary', 'blogname', 'blog_name', 'tumblelog', 'title', 'body', 'description', 'caption', 'question', 'answer', 'text', 'tags'];

class FuseSearch {
  fuse = {};
  options = {
    caseSensitive: false,
    includeScore: true,
    shouldSort: true,
    tokenize: true,
    threshold: 0.6,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    keys: POST_KEYS,
    id: 'id'
  }
  constructor() {
    db.posts.toCollection().toArray().then(posts => {
      this.posts = keyBy(posts, 'id');
      this.fuse = new Fuse(posts, this.options);
    });
  }

  async setBlog(slug) {
    const tumblelog = slug.payload;
    try {
      console.log('[SET BLOG]', tumblelog);
      const posts = await db.posts.where('blog_name').equalsIgnoreCase(tumblelog).toArray();
      this.posts = keyBy(posts, 'id');
      this.fuse = new Fuse(posts, this.options);
    } catch (e) {
      console.error(e);
    }
  }

  async search(query) {
    console.log(query);
    const deferred = Deferred();
    try {
      const posts = [];
      const results = this.fuse.search(query.term);
      results.map(id => {
        posts.push(this.posts[id]);
      });
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
