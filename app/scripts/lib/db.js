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

db.open().then(() => {
  // port.postMessage('initialized');
}).catch(error => {
  console.error(error);
});

export function resetCache(callback) {
  chrome.storage.local.clear(() => {
    const error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
      callback(error);
    }
    chrome.storage.local.get({
      cachedPostsCount: 0,
      cachedFollowingCount: 0,
      cachedTagsCount: 0,
      totalFollowingCount: 0,
      totalPostsCount: 0,
      totalTagsCount: 0
    }, items => {
      Object.assign(constants, items);
    });
  });
  db.delete().then(() => {
    console.log('[DB] deleted');
    const response = {
      percentComplete: 100,
      itemsLeft: 0,
      total: 0,
      database: 'all'
    };
    callback(response);
    console.log('[CONSTANTS]', constants);
  }).catch(error => {
    console.error('[DB]', error);
    callback(error);
  });
}


module.exports = db;
