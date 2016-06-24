import Dexie from 'dexie';

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


db.open().then(() => {
  console.log(db);
}).catch(error => {
  console.error(error);
});

export default db;
