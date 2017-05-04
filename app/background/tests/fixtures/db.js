import Dexie from 'dexie';
import { debug } from '../../services/loggingService';
// import following from './following.json';
import 'babel-polyfill';

const db = new Dexie('TumblrFoxTest');

db.version(26).stores({
  posts: 'id, blog_name, note_count, *tags, *tokens, type, order',
  likes: 'id, blog_name, liked_timestamp, note_count, *tags, *tokens, type, liked',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.version(27).stores({
  posts: 'id, blog_name, note_count, *tags, *tokens, type, timestamp',
  likes: 'id, blog_name, liked_timestamp, note_count, *tags, *tokens, type, liked',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.open().then(() => {
  debug(db);
  debug('test db initialized');
}).catch(error => {
  console.error(error);
});

export default db;
