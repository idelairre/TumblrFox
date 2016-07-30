import Dexie from 'dexie';
import { debug } from '../services/loggingService';
import 'babel-polyfill';

const db = new Dexie('TumblrFox');

db.version(26).stores({
  posts: 'id, blog_name, note_count, *tags, *tokens, type, order', // TODO: fix order incrementer so new blog posts appear at the beginning
  likes: 'id, blog_name, liked_timestamp, note_count, *tags, *tokens, type, liked',
  following: 'name, updated, order, content_rating',
  tags: 'tag, count'
});

db.on('error', e => {
  console.error(e.stack || e);
});

console.time('initialize');

db.open().then(() => {
  debug(db);
  console.timeEnd('initialize');
}).catch(error => {
  console.error(error);
});

window.downloadTableJson = function (table, query) {
  const download = response => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(response)], {
      type: `application/json,charset=utf-8`
    }));
    chrome.downloads.download({ url, filename: `tumblrfox-${table}-data.json` });
  }
  if (query) {
    db[table].where(query.index).anyOfIgnoreCase(query.term).limit(query.limit).toArray().then(download);
  } else {
    db[table].toCollection().toArray().then(download);
  }
}

export default db;
