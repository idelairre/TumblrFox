import Dexie from 'dexie';
import { escape } from 'lodash';
import { debug } from '../services/loggingService';
import 'babel-polyfill';

const db = new Dexie('TumblrFox');

// posts = user blog posts
// likes = user likes
// tags = populated from likes

db.version(26).stores({
  posts: 'id, blog_name, note_count, *tags, *tokens, type, order', // TODO: fix order incrementer so new blog posts appear at the beginning
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

console.time('initialize');

db.open().then(() => {
  debug(db);
  console.timeEnd('initialize');
}).catch(error => {
  console.error(error);
});

function decodeUtf8(s) {
  return decodeURIComponent(escape(s));
}

window.downloadTableJson = function (table, query) {
  const download = response => {
    const json = JSON.stringify(response);
    const blob = new Blob([query.escape ? escape(json) : json]);
    const url = URL.createObjectURL(blob, {
      type: `application/json,charset=utf-8`
    });
    chrome.downloads.download({ url, filename: `${query.filename}.json` || `tumblrfox-${table}-data.json` });
  }
  if (query.term && query.limit) {
    db[table].where(query.index).anyOfIgnoreCase(query.term).limit(query.limit).toArray().then(download);
  } else if (query.limit) {
    db[table].toCollection().limit(query.limit).toArray().then(download);
  } else {
    db[table].toCollection().toArray().then(download);
  }
}

export default db;
