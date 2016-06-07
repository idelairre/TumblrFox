import { Deferred } from 'jquery';
import { keyBy } from 'lodash';
import db from '../lib/db';
import Fuse from '../lib/fuse';
import constants from '../constants';
import 'babel-polyfill';

// TODO: add weights

const POST_KEYS = ['summary', 'blogname', 'blog_name', 'tumblelog', 'title', 'body', 'description', 'caption', 'question', 'answer', 'text', 'tags'];

class FuseSearch {
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
    constants.addListener('ready', () => {
      if (constants.get('fullTextSearch')) {
        db.posts.toCollection().toArray().then(posts => {
          this.posts = keyBy(posts, 'id');
          this.fuse = new Fuse(posts, this.options);
          console.log(this.fuse);
        });
      }
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
    const deferred = Deferred();
    try {
      const posts = [];
      const results = this.fuse.search(query.term);
      results.map(result => {
        posts.push(this.posts[result.item]);
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
