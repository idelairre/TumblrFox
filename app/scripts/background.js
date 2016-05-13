import $ from 'jquery';
import { camelCase, countBy, debounce, differenceBy, flatten, identity } from 'lodash';
import async from 'async';
import Dexie from 'dexie';
import { spawn } from 'dexie';
import { ChromeExOAuth } from './lib/chrome_ex_oauth';
import { AUTHORIZATION_BASE_URL, ACCESS_TOKEN_URL, REQUEST_TOKEN_URL } from './constants';
import 'babel-polyfill';
import './lib/livereload';

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

db.open().catch(error => {
  console.error(error);
});

function toTumblrTime(date) {
  return Date.parse(date) / 1000;
}

function fromTumblrTime(dateValue) {
  return new Date(dateValue * 1000);
}

function decrementTumblrDay(date) {
  return toTumblrTime(fromTumblrTime(date).subtractDays(1));
}

Date.prototype.subtractDays = function (days) {
  this.setDate(this.getDate() - days);
  return this;
};

let oauth = {};

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  // chrome.pageAction.show(tabId);
});

chrome.storage.sync.get({ consumerKey: '', consumerSecret: '' }, items => {
  oauth = ChromeExOAuth.initBackgroundPage({
    request_url: REQUEST_TOKEN_URL,
    authorize_url: AUTHORIZATION_BASE_URL,
    access_url: ACCESS_TOKEN_URL,
    consumer_key: items.consumerKey,
    consumer_secret: items.consumerSecret
  });
});

function calculatePercent(count, objects) {
  const percentComplete = ((count / objects) * 100).toFixed(2);
  const itemsLeft = objects - count;
  const total = objects;
  return { percentComplete, itemsLeft, total };
}

// TODO: break this up so that it can report progress to front end
// NOTE: this had a tendency to crash the browser
function parseTags(tags, callback) {
  try {
    let parsedTags = [];
    const orderedTags = countBy(tags, identity);
    for (const key in orderedTags) {
      const tag = {
        tag: key,
        count: orderedTags[key]
      };
      parsedTags.push(tag);
    }
    callback(parsedTags);
  } catch (e) {
    console.error(e);
  }
}

function cacheLikeTags(callback) {
  console.log('[CACHING TAGS...]');
  let items = {
    totalTagsCount: 0,
    cachedTagsCount: 0,
    total: 0
  };
  db.posts.orderBy('tags').keys(tags => {
    console.log('[TAGS LENGTH]', tags.length);
    tags = flatten(tags.filter(tagArray => {
      if (tagArray.length > 0) {
        return tagArray;
      }
    }));
    parseTags(tags, response => {
      console.log('[TAGS]', tags.length);
      let i = 0;
      while (response.length > i) {
        console.log('[ADDING]', response[i].tag);
        db.tags.put(response[i]);
        items.total = response.length;
        i += 1;
        log('tags', i, items, response => {
          callback(response);
        });
      }
    });
  });
}

function preloadFollowing(callback) {
  spawn(function*() {
    yield db.following.toCollection().delete();
    let count = yield db.following.toCollection().count();
    chrome.storage.sync.get({
      userName: '',
      totalFollowingCount: 0
    }, items => {
      let slug = {
        url: `https://api.tumblr.com/v2/user/following`,
        limit: 20,
        offset: 0
      };
      console.log('[CACHED FOLLOWING]', count);
      populateFollowing(slug, items, count, callback);
    });
  });
}

function log(database, itemCount, items, callback) {
  db[database].toCollection().count(count => {
    itemCount = (count - 1);
    const cachedKey = camelCase(`cached-${database}-count`);
    const totalKey = camelCase(`total-${database}-count`);
    const { percentComplete, itemsLeft, total } = calculatePercent(itemCount, items.total);
    let storageSlug = {};
    storageSlug[cachedKey] = itemCount;
    chrome.storage.local.set(storageSlug);
    // console.log('[SYNC KEY]', items[totalKey]);
    // console.log('[STORAGE KEY]', storageSlug[cachedKey]);
    if (items[totalKey] === 0) {
      let syncSlug = {};
      syncSlug[totalKey] = items.total;
      items[totalKey] = items.total;
      chrome.storage.sync.set(syncSlug);
    }
    // console.log('[KEYS]', cachedKey, totalKey);
    console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}`);
    callback({ database, percentComplete, itemsLeft, total });
  });
};

function populateFollowing(slug, items, followingCount, callback) {
  async.whilst(() => {
    return items.totalFollowingCount === 0 || items.totalFollowingCount > followingCount;
  }, next => {
    debounce(oauthRequest, 0).call(this, slug, response => {
      if (response.blogs && response.blogs.length) {
        slug.offset += response.blogs.length;
        items.total = response.total_blogs;
        for (const key in slug) {
          if (key.includes('oauth')) {
            delete slug[key];
          }
        }
        const transaction = db.following.bulkPut(response.blogs);
        transaction.then(() => {
          log('following', followingCount, items, response => {
            next(null);
            callback(response);
          });
        });
        transaction.catch(Dexie.BulkError, error => {
          log('following', followingCount, items, response => {
            console.log('[DB ERROR]', error.message);
            console.log('[DB ERROR]', response);
            next(null);
            callback(response);
          });
        });
      } else {
        console.log('[RESPONSE EMPTY. DONE CACHING]');
        log('following', followingCount, items, response => {
          response.percentComplete = 100;
          response.itemsLeft = 0;
          next(null);
          callback(response);
        });
      }
    });
  }, error => {
    console.error(error);
  });
}

function preloadLikes(callback) {
  console.log('[PRELOADING LIKES]');
  chrome.storage.sync.get({ userName: '', totalPostsCount: 0 }, items => {
    let slug = {
      blogname: items.userName,
      limit: 50
    };
    // fetch farthest back cached like
    db.posts.orderBy('liked_timestamp').limit(1).toArray(posts => {
      slug.before = posts[0].liked_timestamp;
      console.log('[BEFORE]', fromTumblrTime(slug.before));
      db.posts.toCollection().count(count => {
        populatePostCache(slug, items, count, callback);
      });
    });
  });
}

function populatePostCache(slug, items, postCount, callback) {
  console.log('[ITEMS]', items);
  async.whilst(() => {
    return items.totalPostsCount === 0 || items.totalPostsCount > postCount;
  }, next => {
    debounce(fetchLikedPosts, 0).call(this, slug, response => {
      if (response.liked_posts.length > 0) {
        items.total = response.liked_count;
        // slug.before = decrementTumblrDay(slug.before);
        slug.before = response.liked_posts[response.liked_posts.length - 1].liked_timestamp;
        console.log('[BEFORE]', fromTumblrTime(slug.before));
        const transaction = db.posts.bulkPut(response.liked_posts);
        transaction.then(() => {
          log('posts', postCount, items, response => {
            next(null);
            callback(response);
          });
        });
        transaction.catch(Dexie.BulkError, error => {
          console.log('[DB]', error.message);
          log('posts', postCount, items, response => {
            next(null);
            callback(response);
          });
        });
      } else {
        console.log('[RESPONSE EMPTY. DONE CACHING]');
        callback({
          percentComplete: 100,
          itemsLeft: 0
        });
        return;
      }
    });
  }, error => {
    console.error(error);
  });
}

// called on extension initialization

function initialSyncLikes(posts) {
  if (!posts || posts.length === 0) {
    return;
  }
  // console.log('[POSTS]', posts.length);
  chrome.storage.sync.get({ userName: '' }, items => {
    const userName = items.userName;
    const slug = {
      blogname: userName,
      offset: 0,
      limit: 50
    };
    const callback = response => {
      posts.toArray(items => {
        const difference = differenceBy(response.liked_posts, items, 'id');
        if (difference.length !== 0) {
          console.log('[ADDING NEW LIKES]', difference);
          posts.bulkPut(difference);
        }
        console.log('[SYNC DONE]');
      });
    };
    console.log('[SYNCING LIKES]');
    fetchLikedPosts(slug, callback);
  });
}

function syncLikes(payload) {
  console.log(payload);
  const { action, postId } = payload;
  chrome.storage.sync.get({ userName: '' }, items => {
    if (action === 'like') {
      const slug = {
        blogname: items.userName,
        offset: 0,
        limit: 1
      };
      fetchLikedPosts(slug, response => {
        db.posts.toCollection().count(count => {
          db.posts.add(response.liked_posts[0]);
          console.log('[ADDED LIKE]');
        });
      });
    } else {
      db.posts.delete(postId).then(() => {
        console.log('[REMOVED LIKE]');
      });
    }
  });
}

function fetchLikeTags(callback) {
  db.tags.orderBy('count').reverse().toArray(tags => {
    console.log('[STORED TAGS]', tags);
    callback(tags);
  });
}

function fetchBlogPosts(slug, callback) {
  chrome.storage.sync.get({ consumerKey: '' }, items => {
    const url = `https://api.tumblr.com/v2/blog/${slug.blogname}.tumblr.com/posts${slug.type ? '/' + slug.type : ''}`;
    const request = $.ajax({
      type: 'GET',
      url: `${url}?api_key=${items.consumerKey}`,
      data: {
        limit: slug.limit || 8,
        offset: slug.offset || 0
      }
    });
    request.always(data => {
      callback(data.response);
    });
  });
}

function fetchFollowing(query, callback) {
  if (query === 'alphabetically') {
    db.following.orderBy('name').toArray(followers => {
      console.log('[FOLLOWERS]', followers);
      return callback(followers);
    });
  } else {
    db.following.orderBy('updated').reverse().toArray(followers => {
      console.log('[FOLLOWERS]', followers);
      return callback(followers);
    });
  }
}

function fetchLikedPosts(slug, callback) {
  console.log('[SLUG]', slug);
  // console.log('[BEFORE DATE]', new Date(slug.before * 1000));
  chrome.storage.sync.get({ consumerKey: '' }, items => {
    const data = {
      api_key: items.consumerKey,
      limit: slug.limit || 8
    };
    Object.assign(data, slug);
    const request = $.ajax({
      type: 'GET',
      url: `https://api.tumblr.com/v2/blog/${slug.blogname}.tumblr.com/likes`,
      data: data
    });
    request.success(data => {
      callback(data.response);
    });
    request.fail(error => {
      console.error('[FAIL]', error);
      callback(error);
    });
  });
}

// TODO: refactor to make use of indexeddb methods
function searchLikes(args, callback) {
  console.log('[SEARCH LIKES]', args);
  const term = (typeof args === 'string' ? args : args.term);
  spawn(function*() {
    let posts = yield db.posts.toCollection().toArray();
    let matches = posts;
    if (term !== '') {
      matches = matches.filter(post => {
        if (post.tags.indexOf(term) > -1) {
          return post;
        }
      });
    }
    if (args.post_type && args.post_type !== 'ANY') {
      const type = args.post_type.toLowerCase();
      matches = matches.filter(post => {
        if (post.type === type) {
          return post;
        }
      });
    }
    if (args.sort && args.sort === 'CREATED_DESC') {
      matches = matches.sort((a, b) => {
        return a.timestamp - b.timestamp;
      }).reverse();
    } else if (args.sort && args.sort === 'POPULARITY_DESC') {
      matches = matches.sort((a, b) => {
        return a.note_count > b.note_count ? 1 : (a.note_count < b.note_count ? -1 : 0);
      }).reverse();
    }
    if (args.before) {
      matches = matches.filter(post => {
        console.log('[LIKED]', new Date(post.liked_timestamp * 1000), post.liked_timestamp < args.before);
        if (post.liked_timestamp < args.before) {
          return post;
        }
      });
    }
    console.log('[MATCHES]', matches);
    if (args.offset && args.limit) {
      const { offset, limit } = args;
      matches = matches.slice(offset, offset + limit);
      return callback(matches);
    }
    return callback(matches);
  });
}

function oauthRequest(slug, callback) {
  oauth.authorize(() => {
    onAuthorized(slug, callback);
  });
}

// TODO: better error logging
function onAuthorized(slug, callback) {
  console.log('[SLUG]', slug);
  const request = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    parameters: slug
  };

  const url = slug.url || 'https://api.tumblr.com/v2/user/dashboard';

  oauth.sendSignedRequest(url, (data, xhr) => {
    console.log('[XHR]', xhr);
    if (xhr.response !== '') {
      const response = JSON.parse(data).response;
      callback(response);
    } else {
      callback(data);
    }
  }, request);
}

function resetCache(callback) {
  chrome.storage.local.clear(() => {
    const error = chrome.runtime.lastError;
    if (error) {
      console.error(error);
      callback(error);
    }
  });
  db.delete().then(() => {
    console.log('[DB] deleted');
    callback({ percentComplete: 100, itemsLeft: 0 });
  }).catch(error => {
    console.error('[DB]', error);
    callback(error);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  switch (request.type) {
    case 'fetchPosts':
      oauth.authorize(() => {
        onAuthorized(request.payload, sendResponse);
      });
      return true;
    case 'fetchBlogPosts':
      fetchBlogPosts(request.payload, sendResponse);
      return true;
    case 'fetchFollowing':
      fetchFollowing(request.payload, sendResponse);
      return true;
    case 'fetchLikes':
      fetchLikedPosts(request.payload, sendResponse);
      return true;
    case 'fetchTags':
      fetchLikeTags(sendResponse);
      return true;
    case 'searchLikes':
      searchLikes(request.payload, sendResponse);
      return true;
    case 'updateLikes':
      syncLikes(request.payload);
      return true;
    case 'updateFollowing':
      preloadFollowing(sendResponse);
      return true;
    default:
      // do nothing
  }
});

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(request => {
    switch(request.type) {
      case 'cacheLikes':
        preloadLikes(::port.postMessage);
        break;
      case 'cacheTags':
        cacheLikeTags(::port.postMessage);
        break;
      case 'cacheFollowing':
        preloadFollowing(::port.postMessage);
        break;
      case 'resetCache':
        resetCache(::port.postMessage);
        break;
      default:
        // do nothing
      }
  });
});

initialSyncLikes(db.posts);
