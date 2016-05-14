import $ from 'jquery';
import { camelCase, countBy, debounce, delay, differenceBy, flatten, identity } from 'lodash';
import async from 'async';
import Dexie from 'dexie';
import { spawn } from 'dexie';
import { ChromeExOAuth } from './lib/chrome_ex_oauth';
import { AUTHORIZATION_BASE_URL, ACCESS_TOKEN_URL, CONSUMER_KEY, CONSUMER_SECRET, REQUEST_TOKEN_URL } from './constants';
import 'babel-polyfill';
import './lib/livereload';

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
  port.postMessage('initialized');
});

const Utils = {
  toTumblrTime(date) {
    return Date.parse(date) / 1000;
  },
  fromTumblrTime(dateValue) {
    return new Date(dateValue * 1000);
  },
  decrementTumblrDay(date) {
    return Utils.toTumblrTime(Utils.fromTumblrTime(date).subtractDays(1));
  }
}

Date.prototype.subtractDays = function (days) {
  this.setDate(this.getDate() - days);
  return this;
}

let constants = {};

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

chrome.storage.sync.get({ userName: '', consumerKey: '', consumerSecret: ''}, items => {
  Object.assign(constants, items);
});

let db = new Dexie('TumblrFox');

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

let oauth = ChromeExOAuth.initBackgroundPage({
  request_url: REQUEST_TOKEN_URL,
  authorize_url: AUTHORIZATION_BASE_URL,
  access_url: ACCESS_TOKEN_URL,
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET
});

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  // chrome.pageAction.show(tabId);
});

function calculatePercent(count, objects) {
  const percentComplete = ((count / objects) * 100).toFixed(2);
  const itemsLeft = objects - count;
  const total = objects;
  return { percentComplete, itemsLeft, total };
}

function log(database, itemCount, items, callback) {
  db[database].toCollection().count(itemCount => {
    const cachedKey = camelCase(`cached-${database}-count`);
    const totalKey = camelCase(`total-${database}-count`);
    const { percentComplete, itemsLeft, total } = calculatePercent(itemCount, items.total);
    let storageSlug = {};
    storageSlug[cachedKey] = itemCount;
    if (items[totalKey] === 0 || items[totalKey] !== items.total) {
      storageSlug[totalKey] = items.total;
      items[totalKey] = items.total;
    }
    chrome.storage.local.set(storageSlug);
    console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}`);
    callback({ database, percentComplete, itemsLeft, total });
  });
}

// TODO: break this up so that it can report progress to front end
// NOTE: this had a tendency to crash the browser
function parseTags(tags, callback) {
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

function resetOauthSlug(slug) {
  for (const key in slug) {
    if ({}.hasOwnProperty.call(slug, key)) {
      if (key.includes('oauth')) {
        delete slug[key];
      }
    }
  }
}

function preloadFollowing(port) {
  spawn(function*() {
    // yield db.following.toCollection().delete();
    let count = yield db.following.toCollection().count();
    let slug = {
      url: `https://api.tumblr.com/v2/user/following`,
      limit: 20,
      offset: constants.cachedFollowingCount - 1
    };
    console.log('[CACHED FOLLOWING]', count);
    populateFollowing(slug, constants, count, port);
  });
}

function processFollowing({ slug, followingCount, response, items }) {
  const deferred = $.Deferred();
  slug.offset += response.blogs.length;
  items.total = response.total_blogs;
  constants.cachedfollowingCount = followingCount;
  constants.totalfollowingCount = items.totalFollowingCount;
  if (response.blogs && response.blogs.length) {
    resetOauthSlug(slug);
    const transaction = db.following.bulkPut(response.blogs);
    transaction.then(() => {
      deferred.resolve();
    });
    transaction.catch(Dexie.BulkError, error => {
      console.log('[DB ERROR]', error.message);
      deferred.reject(error);
    });
  } else {
    resetOauthSlug(slug);
    deferred.reject('Response was empty');
  }
  return deferred.promise();
}

function populateFollowing(slug, items, followingCount, port) {
  async.whilst(() => {
    return items.totalFollowingCount === 0 || items.totalFollowingCount > followingCount;
  }, next => {
    oauthRequest(slug).then(response => {
      let nextSlug = { slug, followingCount, response, items };
      console.log('[RESPONSE]', response);
      processFollowing(nextSlug).then(() => {
        log('following', followingCount, items, data => {
          next(null);
          port(data);
        });
      }).fail(error => {
        log('following', followingCount, items, data => {
          next(error);
          port(data);
        });
      });
    });
  }, error => {
    console.error(error);
  });
}

function syncFollowing() {
  const slug = {
    url: `https://api.tumblr.com/v2/user/following`,
    limit: 1,
    offset: 0
  };
  oauthRequest(slug).then(response => {
    db.following.put(response.blogs[0]);
  });
}

function preloadLikes(callback) {
  spawn(function*() {
    let count = yield db.posts.toCollection().count();
    console.log('[PRELOADING LIKES]');
    let slug = {
      blogname: constants.userName,
      limit: 50
    };
    // fetch farthest back cached like
    if (count !== 0) {
      let posts = yield db.posts.orderBy('liked_timestamp').limit(1).toArray();
      slug.before = posts[0].liked_timestamp;
    }
    populatePostCache(slug, constants, count, callback);
  });
}

function populatePostCache(slug, items, postCount, callback) {
  console.log('[ITEMS] called', arguments);
  async.whilst(() => {
    return items.totalPostsCount === 0 || items.totalPostsCount > postCount;
  }, next => {
    debounce(fetchLikedPosts, 0).call(this, slug, response => {
      if (response.liked_posts.length > 0) {
        items.total = response.liked_count;
        slug.before = response.liked_posts[response.liked_posts.length - 1].liked_timestamp;
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
        log('posts', postCount, items, response => {
          callback(response);
        });
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
  const slug = {
    blogname: constants.userName,
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
}

function syncLikes(payload) {
  console.log(payload);
  const { action, postId } = payload;
  if (action === 'like') {
    const slug = {
      blogname: constants.userName,
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
}

function fetchLikeTags(callback) {
  console.log(db);
  db.tags.orderBy('count').reverse().toArray(tags => {
    console.log('[STORED TAGS]', tags);
    callback(tags);
  });
}

function fetchBlogPosts(slug, callback) {
  const url = `https://api.tumblr.com/v2/blog/${slug.blogname}.tumblr.com/posts${slug.type ? '/' + slug.type : ''}`;
  const request = $.ajax({
    type: 'GET',
    url: `${url}?api_key=${constants.consumerKey || CONSUMER_KEY}`,
    data: {
      limit: slug.limit || 8,
      offset: slug.offset || 0
    }
  });
  request.always(data => {
    callback(data.response);
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
  const data = {
    api_key: constants.consumerKey || CONSUMER_KEY,
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

function oauthRequest(slug) {
  const deferred = $.Deferred();
  oauth.authorize(() => {
    onAuthorized(slug, response => {
      if (response !== '') {
        deferred.resolve(response);
      } else {
        deferred.reject(response);
      }
    });
  });
  return deferred.promise();
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
    // console.log('[XHR]', xhr);
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  switch (request.type) {
    case 'sendData':
      constants.currentUser = request.payload.currentUser;
      break;
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
      syncFollowing(sendResponse);
      return true;
    default:
      // do nothing
  }
});
