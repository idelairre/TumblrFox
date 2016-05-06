import { ChromeExOAuth } from './lib/chrome_ex_oauth';
import { AUTHORIZATION_BASE_URL, ACCESS_TOKEN_URL, REQUEST_TOKEN_URL } from './constants';
import { countBy, debounce, defer, difference, findIndex, identity, includes, union, uniqBy } from 'lodash';
import async from 'async';
import $ from 'jquery'
import './lib/livereload';

function hasElement(array, compArray) {
  for (let i = 0; array.length - 1 > i; i += 1) {
    let post = array[i];
    for (let j = 0; compArray.length - 1 > j; j += 1) {
      let testPost = compArray[j];
      if (post.id === testPost.id) {
        return true;
      }
    }
  }
  return false;
}

let oauth = {};

let db = null;

function openDB() {
  const deferred = $.Deferred();
  const request = indexedDB.open('TumblrFox');

  request.onerror = (event) => {
    console.error('[DB], error bitch', event.target.errorCode);
    deferred.reject();
  }

  request.onsuccess = (event) => {
    db = event.target.result;
    console.log('[DB] database opened');
    deferred.resolve();
  }

  request.onupgradeneeded = (event) => {
    db = event.target.result;
    let objectStore = db.createObjectStore('posts', {
      keyPath: 'id'
    });
    // store.createIndex() ...
    objectStore.transaction.oncomplete = (event) => {
      let postsObjectStore = db.transaction('posts', 'readwrite').objectStore('posts');
    }
  }
  return deferred.promise();
}

function add(obj) {
  let transaction = db.transaction(['posts'], 'readwrite');
  let store = transaction.objectStore('posts');
  obj.created = new Date();
  let request = store.add(obj);

  request.onsuccess = (event) => {
    console.log('[DB] post added', JSON.stringify(obj));
  }

  request.onerror = (event) => {
    console.error('[DB] error', event.target.error.name);
  }
}

// key = id
function findByKey(key) {
  let transaction = db.transaction(['posts'], 'readonly');
  let store = transaction.objectStore('posts');
  let request = store.get(key);

  request.onsuccess = (event) => {
    console.log(e.target.result);
  }
}

function findAll() {
  let transaction = db.transaction(['posts'], 'readonly');
  let objectStore = transaction.objectStore('posts');
  let cursor = objectStore.openCursor();

  cursor.onsuccess = (event) => {
    let result = event.target.result;
    if (result) {
      console.log('[DB] key', result.key);
      console.log('[DB] value', result.value);
      result.continue();
    }
  }
}

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  // chrome.pageAction.show(tabId);
});

chrome.storage.sync.get({
  consumerKey: '',
  consumerSecret: ''
}, items => {
  oauth = ChromeExOAuth.initBackgroundPage({
    'request_url': REQUEST_TOKEN_URL,
    'authorize_url': AUTHORIZATION_BASE_URL,
    'access_url': ACCESS_TOKEN_URL,
    'consumer_key': items.consumerKey,
    'consumer_secret': items.consumerSecret,
  });
});

function cacheLikeTags(callback) {
  chrome.storage.local.get('posts', items => {
    let tags = [];
    let posts = items.posts;
    for (let i = 0; posts.length - 1> i; i += 1) {
      let post = posts[i];
      if (post.tags && post.tags.length > 0) {
        for (let j = 0; post.tags.length - 1 > j; j += 1) {
          let tag = post.tags[j];
          tags.push(tag);
        }
      }
    }
    tags = countBy(tags, identity);
    let parsedTags = [];
    for (let key in tags) {
      let tag = {
        tag: key,
        count: tags[key]
      }
      parsedTags.push(tag);
    }
    parsedTags = parsedTags.sort((a, b) => {
      return a.count - b.count;
    }).reverse();
    chrome.storage.local.set({ tags: parsedTags }, () => {
      console.log('[TAGS]', parsedTags);
    });
    callback('done');
  });
}

function preloadFollowing(callback) {
  chrome.storage.local.get({
    userName: '',
    followingCount: 0
  }, items => {
    let slug = {
      url: `https://api.tumblr.com/v2/blog/${items.userName}/followers`,
    };
    populateFollowers(slug, items, callback);
  });
}

function populateFollowers(slug, items, callback) {
  async.whilst(() => {
    return items.followingCount === 0 || items.followingCount > (items.following.length )
  }, next => {

    next();
  }, error =>{

  })
}

function preloadLikes(callback) {
  chrome.storage.sync.get({
    userName : '',
    likedPostsCount: 0
  }, syncItems => {
    let slug = {
      blogname: syncItems.userName,
      limit: 50
    };
    chrome.storage.local.get({ posts: [] }, localItems => {
      let items = Object.assign(syncItems, localItems);
      console.log('[POSTS COUNT]', items.posts.length);
      console.log('[ITEMS]', items);
      populatePostCache(slug, items, callback);
    });
  });
}

function populatePostCache(slug, items, callback) {
  const save = (posts, next) => {
    try {
      if (JSON.stringify(posts)) {
        chrome.storage.local.set({ posts: posts }, () => {
          next();
        });
      }
    } catch(e) {
      console.error(e);
    }
  };
  async.whilst(() => {
    return items.likedPostsCount === 0 || items.likedPostsCount > (items.posts.length - 1);
  }, next => {
    if (items.likedPostsCount !== 0 && (items.likedPostsCount - (items.posts.length - 1)) < slug.limit) {
      slug.limit = (items.likedPostsCount - (items.posts.length - 1));
    }
    if (items.posts.length !== 0) {
      slug.before = items.posts[items.posts.length - 1].liked_timestamp;
    }
    debounce(fetchLikedPosts, 0).call(this, slug, response => {
      if (items.likedPostsCount === 0) {
        items.likedPostsCount = response.liked_count;
        chrome.storage.sync.set({
          likedPostsCount: items.likedPostsCount
        });
      }
      Array.prototype.push.apply(items.posts, response.liked_posts);
      let percentComplete = (((items.posts.length - 1) / items.likedPostsCount) * 100).toFixed(2);
      let itemsLeft = items.likedPostsCount - (items.posts.length - 1);
      percentComplete = (itemsLeft === 0 ? 100 : percentComplete);
      console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}`);
      callback({
        percentComplete: percentComplete,
        itemsLeft: itemsLeft
      });
      if (Math.ceil(percentComplete % 10 === 0)) {
        save(items.posts, next);
      } else {
        next();
      }
    });
  }, error => {
    console.error(error);
  });
}

function initSyncLikes(posts) {
  if (!posts || posts.length === 0) {
    return;
  }
  // console.log('[POSTS]', posts.length);
  chrome.storage.sync.get({ userName: '' }, items => {
  const userName = items.userName;
    let slug = {
      blogname: userName,
      offset: 0,
      limit: 50
    };
    let callback = (response) => {
      if (response.liked_posts.length !== 0) {
        console.log('[NEW POSTS?]', !hasElement(posts, response.liked_posts));
        if (!hasElement(posts, response.liked_posts)) {
          slug.offset += response.liked_posts.length;
          posts = union(posts, response.liked_posts);
          if (typeof posts !== 'undefined') {
            chrome.storage.local.set({ posts: posts });
            console.log('[POSTS]', posts.length);
          } else {
            throw new Error('Posts are corrupt');
          }
          fetchLikedPosts(slug, callback);
        } else {
          console.log('[DONE SYNCING]')
        }
      }
    }
    fetchLikedPosts(slug, callback);
  });
}

// NOTE: this is simply too slow
// it turns out that accessing localStorage blocks the DOM
// so this solution is out
// maybe queue these actions and then execute when the system is idle?
// maybe get rid of localstorage alltogether and cache on firebase?

function syncLikes(payload) {
  let { action, postId } = payload;
  if (action === 'like') {
    chrome.storage.sync.get({ userName: '' }, items => {
      const userName = items.userName;
      let slug = {
        blogname: userName,
        offset: 0,
        limit: 1
      };
      fetchLikedPosts(slug, response => {
        chrome.storage.local.get('posts', items => {
          let oldLen = items.posts.length;
          items.posts.unshift(response.liked_posts[0]);
          console.log('[UPDATED LIKES]', oldLen, items.posts.length);
          chrome.storage.local.set({ posts: items.posts });
        });
      });
    });
  } else {
    chrome.storage.local.get({ posts: [] }, items => {
      let posts = items.posts;
      let index = findIndex(posts, { id: postId });
      console.log('[POST INDEX]', index);
      if (index >= 0) {
        let oldLen = posts.length;
        posts.splice(index, 1);
        console.log(`[UPDATED LIKES] old length: ${oldLen}, new length: ${posts.length}`);
        chrome.storage.local.set({ posts: posts });
      }
    });
  }
}

function ensureIntegrity() {
  const deferred = $.Deferred();
  try {
    chrome.storage.local.get({ posts: [] }, items => {
      let posts = items.posts;
      if (typeof posts === 'undefined' || posts.length === 0) {
        return deferred.reject();
      }
      console.log('[ENSURING INTEGRITY...]');
      JSON.stringify(posts);
      let postsLen = posts.length;
      console.log('[POSTS]', posts.length);
      posts = uniqBy(posts, 'id');
      if (postsLen !== posts.length) {
        chrome.storage.local.set({ posts: posts });
      }
      deferred.resolve(posts);
    });
    return deferred.promise();
  } catch (e) {
    return deferred.reject(e);
  }
}

function fetchPreloadedLikes(callback) {
  chrome.storage.local.get({ posts: [] }, items => {
    console.log('[STORED POSTS]', items.posts);
    callback(items.posts);
  });
}

function fetchLikeTags(callback) {
  chrome.storage.local.get({ tags: [] }, items => {
    console.log('[STORED TAGS]', items.tags);
    callback(items.tags);
  });
}

function fetchBlogPosts(slug, callback) {
  chrome.storage.sync.get({
    consumerKey: ''
  }, items => {
    const url = `https://api.tumblr.com/v2/blog/${slug.blogname}.tumblr.com/posts${slug.type ? '/' + slug.type : ''}`;
    let request = $.ajax({
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

function fetchLikedPosts(slug, callback) {
  // console.log('[SLUG]', slug);
  // console.log('[BEFORE DATE]', new Date(slug.before * 1000));
  chrome.storage.sync.get({ consumerKey: '' }, items => {
    let data = {
      api_key: items.consumerKey,
      limit: slug.limit || 8,
    };
    Object.assign(data, slug);
    let request = $.ajax({
      type: 'GET',
      url: `https://api.tumblr.com/v2/blog/${slug.blogname}.tumblr.com/likes`,
      data: data
    });
    request.success(data => {
      // console.log('[RESPONSE]', data.response);
      callback(data.response);
    });
    request.fail(error => {
      console.error(error);
      callback(error);
    });
  });
}

function searchLikes(args, callback) {
  console.log('[SEARCH LIKES]', args);
  chrome.storage.local.get({ posts: [] }, items => {
    let term = (typeof args === 'string' ? args : args.term);
    let matches = items.posts;
    if (term !== '') {
      matches = matches.filter(post => {
        if (post.tags.indexOf(term) > -1) {
          return post;
        }
      });
    }
    matches = term === '' ? matches.slice(0, 5000) : matches;
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
        return a.note_count > b.note_count ? 1 : (a.note_count < b.note_count ? -1: 0);
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
    console.log(JSON.parse(data).response);
    const response = JSON.parse(data).response;
    callback(response);
  }, request);
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
    case 'fetchLikes':
      fetchLikedPosts(request.payload, sendResponse);
      return true;
    case 'likeTags':
      fetchLikeTags(sendResponse);
      return true;
    case 'searchLikes':
      searchLikes(request.payload, sendResponse);
      return true
    case 'updateLikes':
      syncLikes(request.payload);
      return true;
    case 'fetchFollowers':
      oauth.authorize(() => {
        onAuthorized(request.payload, sendResponse);
      });
      return true;
    }
});

chrome.runtime.onConnect.addListener(port => {
  port.onMessage.addListener(msg => {
    if (msg.type === 'cacheLikes') {
      preloadLikes(response => {
        port.postMessage(response);
      });
    }
    if (msg.type === 'cacheTags') {
      cacheLikeTags(response => {
        port.postMessage(response);
      });
    }
  });
});

ensureIntegrity().then(initSyncLikes);
