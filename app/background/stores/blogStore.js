import { has, isEqual, isFunction, noop } from 'lodash';
import db from '../lib/db';
import filters from '../utils/filters';
import marshalQuery from '../utils/marshalQuery';
import noopCallback from '../utils/noopCallback';
import Source from '../source/blogSource';
import Lunr from '../services/lunrSearchService';
import { logValues, logError } from '../services/loggingService';
import constants from '../constants';

export default class Blog {
  static caching = false;

  static async fetch(query) {
    query = marshalQuery(query);
    const _filters = filters.bind(this, query);
    try {
      let matches = [];
      if (query.sort !== 'CREATED_DESC') {
        matches = await db.posts.orderBy('note_count').filter(_filters).reverse().toArray();
      } else if (query.post_type) {
        matches = await db.posts.where('type').anyOfIgnoreCase(query.post_type).filter(_filters).reverse().toArray();
      } else {
        matches = await db.posts.orderBy('timestamp').filter(_filters).reverse().toArray();
      }
      return matches.slice(query.next_offset, query.next_offset + query.limit);
    } catch (err) {
      console.error(err);
    }
  }

  static async get(id) {
    try {
      return await db.posts.get(id);
    } catch (err) {
      console.error(err);
    }
  }

  static async put(post) { // cross reference with timestamp, when user requests posts order by timestamp, that should fix the indexing problem
    try {
      let count = await db.posts.toCollection().count();
      const [apiPost] = await Source.fetchBlogPosts({ blogname: post.blog_name, id: post.id, limit: 1 });

      post.timestamp = apiPost.timestamp;
      post._id = count;
      post.tokens = Lunr.tokenizeHtml(post.html);

      if (!has(post, 'note_count') && has(post, 'notes')) {
        post.note_count = post.notes.count;
      }

      const user = await Source.getContentRating(post['tumblelog-parent-data'].name);
      post['tumblelog-content-rating'] = user.content_rating;

      await db.posts.put(post);
      count = await db.posts.toCollection().count();
      constants.set('cachedPostsCount', count);
    } catch (err) {
      console.error(err);
    }
  }

  static bulkPut(posts) {
    try {
      return Promise.all(posts.map(Blog.put));
    } catch (err) {
      console.error(err);
    }
  }

  static async cache(sendResponse) {
    if (Blog.caching) {
      return;
    }

    Blog.caching = true;

    const sendProgress = isFunction(sendResponse) ? logValues.bind(this, 'posts', sendResponse) : noopCallback;
    const sendError = isFunction(sendResponse) ? logError : noop;

    Source.addListener('items', async posts => {
      await Blog.bulkPut(posts);
      sendProgress();
      Source.next();
    });
    Source.addListener('error', err => {
      sendError(err, sendResponse);
      Blog.caching = false;
    });
    Source.addListener('done', msg => {
      Blog.caching = false;
      if (isFunction(sendResponse)) {
        sendResponse({
          type: 'done',
          payload: constants,
          message: msg
        });
      }
    });
    Source.start();
  }

  static async update() { // NOTE: this needs a test
    if (Blog.caching) {
      return;
    }

    Source.addListener('items', posts => {
      try {
        const promises = posts.map(testPost => {
          const post = Blog.get(testPost.id);
          if (!post) {
            return Blog.put(testPost);
          }
        });
        Promise.all(promises);
      } catch (err) {
        console.error(err);
      }
    });
    Source.addListener('error', err => {
      Blog.caching = false;
      console.error(err);
    });
    Source.addListener('done', () => {
      Blog.caching = false;
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
