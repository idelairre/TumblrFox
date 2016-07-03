import async from 'async';
import Dexie from 'dexie';
import { first, union } from 'lodash';
import Lunr from '../services/lunrSearchService';
import 'babel-polyfill';

const db = new Dexie('TumblrFox');

const Promise = Dexie.Promise;

const updateContentRating = async () => {
  let offset = 0;
  let count = await db.following.toCollection().count();
  async.doWhilst(async next => {
    await db.transaction('rw', db.following, db.posts, async () => {
      const following = await db.following.toCollection().filter(follower => {
        return !follower.content_rating;
      }).offset(offset).limit(100).toArray();
      offset += following.length;
      if (following.length > 0) {
        return Dexie.Promise.all(following.map(async follower => {
          const post = await db.posts.where('blog_name').equals(follower.name).first();
          if (post && post.hasOwnProperty('tumblelog-content-rating')) {
            follower.content_rating = post['tumblelog-content-rating'];
          } else {
            follower.content_rating = 'safe';
          }
          return db.following.put(follower);
        }));
      }
      next(null, following.length);
    }).catch(e => {
      console.error(e.stack || e);
      next(e);
    });
  }, next =>{
    return next !== 0;
  });
}

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
          if (!post.tokens) {
            post.tokens = Lunr.tokenizeHtml(post.html);
            post.tokens = union(post.tags, post.tokens, [post.blog_name]);
            return db.posts.put(post);
          }
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

db.on('error', e => {
  console.error(e.stack || e);
});

db.open().then(() => {
  console.log(db);
}).catch(error => {
  console.error(error);
});

updateTokens();

updateContentRating();

export default db;
