import Dexie from 'dexie';
import { first, union } from 'lodash';
import Lunr from '../services/lunrSearchService';
import 'babel-polyfill';

const db = new Dexie('TumblrFox');

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
})

// db.transaction('rw', db.posts, function *() {
//   const posts = yield db.posts.toCollection().toArray();
//   const promises = posts.filter(post => {
//     if (!post.tokens) {
//       post.tokens = Lunr.tokenizeHtml(post.html);
//       post.tokens = union(post.tags, post.tokens, [post.blog_name]);
//       return db.posts.put(post);
//     }
//   });
//   return Promise.all(promises);
// });

// db.transaction('rw', db.following, db.posts, function *() {
//   const following = yield db.following.toCollection().toArray();
//   for (let i = 0; following.length > i; i += 1) {
//     const follower = following[i];
//     if (!follower.content_rating) {
//       const posts = yield db.posts.where('blog_name').equals(follower.name).toArray();
//       const post = first(posts);
//       if (post && post.hasOwnProperty('tumblelog-content-rating')) {
//         follower.content_rating = post['tumblelog-content-rating'];
//         yield db.following.put(follower);
//       } else {
//         follower.content_rating = 'safe';
//       }
//     }
//   }
// });

db.open().then(() => {
  console.log(db);
}).catch(error => {
  console.error(error);
});

export default db;
