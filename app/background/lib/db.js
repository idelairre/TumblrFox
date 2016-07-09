import async from 'async';
import Dexie from 'dexie';
import { first, union } from 'lodash';
import { debug } from '../services/loggingService';
import Lunr from '../services/lunrSearchService';
import 'babel-polyfill';

const db = new Dexie('TumblrFox');

const Promise = Dexie.Promise;

const updateTokens = async () => {
  let offset = 0;
  let count = await db.posts.toCollection().count();
  async.doWhilst(async next => {
    try {
      const posts = await db.posts.toCollection().filter(post => {
        return !post.tokens;
      }).offset(offset).limit(100).toArray();
      offset += posts.length;
      if (posts.length > 0) {
        const promises = posts.filter(post => {
          post.tokens = Lunr.tokenizeHtml(post.html);
          post.tokens = union(post.tags, post.tokens, [post.blog_name]);
          return db.posts.put(post);
        });
        Promise.all(promises);
      }
      next(null, posts.length);
    } catch (e) {
      next(e);
    }
  }, next => {
    return next !== 0;
  });
}

const updateNotes = async () => {
  let offset = 0;
  async.doWhilst(async next => {
    try {
      const posts = await db.posts.toCollection().filter(post => {
        return !post.note_count;
      }).offset(offset).limit(100).toArray();
      offset += posts.length;
      if (posts.length > 0) {
        const promises = posts.filter(post => {
          post.note_count = post.notes.count;
          return db.posts.put(post);
        });
        Promise.all(promises);
      }
      next(null, posts.length);
    } catch (e) {
      next(e);
    }
  }, next => {
    return next !== 0;
  });
}

db.version(1).stores({
  posts: 'id, liked_timestamp, tags',
  followers: 'name',
  tags: 'tag, count'
});

db.version(2).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, tags, timestamp, type',
  followers: 'name',
  tags: 'tag, count'
});

db.version(3).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, tags, timestamp, type',
  following: 'name',
  tags: 'tag, count'
});

db.version(4).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, tags, timestamp, type',
  following: 'name, updated',
  tags: 'tag, count'
});

db.version(5).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, tags, type',
  following: 'name, updated',
  tags: 'tag, count'
});

db.version(6).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type',
  following: 'name, updated',
  tags: 'tag, count'
});

db.version(7).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, keys',
  followers: null,
  following: 'name, updated',
  tags: 'tag, count'
});

db.version(8).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, *keys',
  following: 'name, updated',
  tags: 'tag, count'
});

db.version(9).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, *keys, terms',
  following: 'name, updated',
  tags: 'tag, count'
});

db.version(10).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, *keys',
  following: 'name, updated',
  terms: 'term, count',
  tags: 'tag, count'
});

db.version(11).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, terms',
  following: 'name, updated',
  terms: 'term, n, idf',
  tags: 'tag, count'
});

db.version(12).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, terms',
  following: 'name, updated',
  terms: null,
  tags: 'tag, count'
});

db.version(13).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, terms',
  following: null,
  tags: 'tag, count'
});

db.version(14).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, terms',
  following: null,
  tags: 'tag, count'
});

db.version(15).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, terms',
  following: '++id, name, updated',
  tags: 'tag, count'
});

db.version(16).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, terms',
  following: null,
  tags: 'tag, count'
});

db.version(17).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, terms',
  following: 'name, updated, order',
  tags: 'tag, count'
});

db.version(18).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, type, terms',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.version(19).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, *tokens, type',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.version(20).stores({
  posts: 'id, blog_name, liked_timestamp, note_count, *tags, *tokens, type, liked',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.version(21).stores({
  posts: 'id, blog_name, note_count, *tags, *tokens, type',
  likes: 'id, blog_name, liked_timestamp, note_count, *tags, *tokens, type, liked',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.version(22).stores({
  posts: 'id, name, note_count, *tags, *tokens, type',
  likes: 'id, blog_name, liked_timestamp, note_count, *tags, *tokens, type, liked',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.version(23).stores({
  posts: 'id, name, note_count, *tags, *tokens, type, is_reblog',
  likes: 'id, blog_name, liked_timestamp, note_count, *tags, *tokens, type, liked',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.on('error', e => {
  console.error(e.stack || e);
});

db.open().then(() => {
  debug(db);
}).catch(error => {
  console.error(error);
});

updateTokens();

updateNotes();

export default db;
