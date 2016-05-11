import { ChromeExOAuth } from './lib/chrome_ex_oauth';
import { AUTHORIZATION_BASE_URL, ACCESS_TOKEN_URL, REQUEST_TOKEN_URL } from './constants';
import { countBy, debounce, defer, differenceBy, findIndex, identity, union, uniqBy } from 'lodash';
import async from 'async';
import Dexie from 'dexie';
import $ from 'jquery'
import './lib/livereload';

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

Date.prototype.subtractDays = function(days) {
  this.setDate(this.getDate() - days);
  return this;
}

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

function parseTags(posts, callback) {
  try {
    let tags = [];
    let parsedTags = [];
    let i = 0;
    while (posts.length - 1 > i) {
      i += 1;
      let post = posts[i];
      let len = post.tags.length;
      if (len !== 0) {
        for (let j = 0; len > j; j += 1) {
          let tag = post.tags[j];
          console.log('[TAG]', tag, i);
          tags.push(tag);
        }
      }
    }
    if (i === (posts.length - 1)) {
      let orderedTags = countBy(tags, identity);
      for (let key in orderedTags) {
        let tag = {
          tag: key,
          count: orderedTags[key]
        }
        parsedTags.push(tag);
      }
      callback(parsedTags);
    }
  } catch (e) {
    console.error(e);
  }
}

function cacheLikeTags(callback) {
  console.log('[CACHING TAGS...]');
  const log = (tagsCount, added) => {
    let percentComplete = ((added / tagsCount) * 100).toFixed(2);
    console.log(`[PERCENT COMPLETE]: ${percentComplete}`,'[POSTS PARSED]:', added, '[POSTS LEFT]:', tagsCount);
    callback({
      percentComplete: percentComplete,
      itemsLeft: tagsCount
    });
  }
  db.posts.toCollection().toArray(posts => {
    parseTags(posts, tags => {
      console.log('[TAGS]', tags.length);
      let i = 0;
      while (tags.length - 1 > i) {
        i += 1;
        console.log('[ADDING]', tags[i]);
        db.tags.add(tags[i]);
        log(tags.length, i);
      }
    });
  });
}

function preloadFollowing(callback) {
  db.following.toCollection().count(count => {
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

function populateFollowing(slug, items, followingCount, callback) {
  // TODO: abstract this
  const log = (followingCount, items, next) => {
    db.following.toCollection().count(count => {
      followingCount = (count - 1);
      chrome.storage.local.set({ cachedFollowing: followingCount }, () => {
        let { percentComplete, itemsLeft } = calculatePercent(followingCount, items.totalFollowingCount);
        console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}, [FOLLOWING]: ${followingCount}`);
        callback ? callback({
          percentComplete: percentComplete,
          itemsLeft: itemsLeft
        }) : null;
        next();
      });
    });
  }
  async.whilst(() => {
    return items.totalFollowingCount === 0 || items.totalFollowingCount > followingCount;
  }, next => {
    // if (items.totalFollowingCount !== 0 && (items.totalFollowingCount - followingCount) < slug.limit) {
    //   slug.limit = (items.totalFollowingCount - followingCount);
    // }
    debounce(oauth.authorize, 10).call(oauth, () => {
      onAuthorized(slug, response => {
        if (response.blogs.length > 0) {
          slug.offset += response.blogs.length;
          items.totalFollowingCount = response.total_blogs;
          if (items.totalFollowingCount === 0) {
            chrome.storage.sync.set({
              totalFollowingCount: items.totalFollowingCount
            });
          }
          for (let key in slug) {
            if (key.includes('oauth')) {
              delete slug[key];
            }
          }
          let transaction = db.following.bulkPut(response.blogs);
          transaction.then(() => {
            log(followingCount, items, next);
          });
          transaction.catch(Dexie.BulkError, error => {
            console.log('[DB ERROR]', error.message);
            log(followingCount, items, next);
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
    });
  }, error => {
    console.error(error);
  });
}

function preloadLikes(callback) {
  console.log('[PRELOADING LIKES]');
  chrome.storage.sync.get({
    userName : '',
    totalLikedPostsCount: 0
  }, items => {
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

function calculatePercent(count, objects) {
  let percentComplete = ((count / objects) * 100).toFixed(2);
  let itemsLeft = objects - count;
  return { percentComplete, itemsLeft };
}

function populatePostCache(slug, items, postCount, callback) {
  console.log('[ITEMS]', items);
  const log = (postCount, items, next) => {
    db.posts.toCollection().count(count => {
      postCount = (count - 1);
      chrome.storage.local.set({ cachedLikes: postCount });
      let { percentComplete, itemsLeft } = calculatePercent(postCount, items.totalLikedPostsCount);
      console.log('[BEFORE DATE]', fromTumblrTime(slug.before));
      console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}, [POSTS]: ${postCount}`);
      callback({
        percentComplete: percentComplete,
        itemsLeft: itemsLeft
      });
      next();
    });
  }
  async.whilst(() => {
    return items.totalLikedPostsCount === 0 || items.totalLikedPostsCount > postCount;
  }, next => {
    if (items.totalLikedPostsCount !== 0 && (items.totalLikedPostsCount - postCount) < slug.limit) {
      slug.limit = (items.totalLikedPostsCount - postCount);
    }
    debounce(fetchLikedPosts, 0).call(this, slug, response => {
      if (response.liked_posts.length > 0) {
        if (items.totalLikedPostsCount === 0) {
          items.totalLikedPostsCount = response.liked_count;
          console.log(items.totalLikedPostsCount);
          chrome.storage.sync.set({
            totalLikedPostsCount: items.totalLikedPostsCount
          });
        }
        slug.before = decrementTumblrDay(slug.before);
        let transaction = db.posts.bulkPut(response.liked_posts);
        transaction.then(() => {
          log(postCount, items, next);
        });
        transaction.catch(Dexie.BulkError, error => {
          console.log('[DB]', error.message);
          log(postCount, items, next);
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
    let slug = {
      blogname: userName,
      offset: 0,
      limit: 50
    };
    let callback = (response) => {
      posts.toArray(items => {
        let difference = differenceBy(response.liked_posts, items, 'id');
        if (difference.length !== 0) {
          console.log('[ADDING NEW LIKES]', difference);
          posts.bulkPut(difference);
        }
        console.log('[SYNC DONE]');
      });
    }
    console.log('[SYNCING LIKES]');
    fetchLikedPosts(slug, callback);
  });
}

function syncLikes(payload) {
  console.log(payload);
  let { action, postId } = payload;
  chrome.storage.sync.get({ userName: '' }, items => {
    if (action === 'like') {
      const userName = items.userName;
      let slug = {
        blogname: userName,
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
      db.posts.delete(post.id).then(() => {
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
  db.posts.toCollection().toArray(posts => {
    let term = (typeof args === 'string' ? args : args.term);
    let matches = posts;
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
    try {
      if (data && JSON.parse(data)) {
        const response = JSON.parse(data).response;
        callback(response);
      }
    } catch (error) {
      console.log(data);
      console.error(error);
      return;
    }
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
      return true
    case 'updateLikes':
      syncLikes(request.payload);
      return true;
    case 'updateFollowing':
      preloadFollowing(sendResponse);
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
    if (msg.type === 'cacheFollowing') {
      preloadFollowing(response => {
        port.postMessage(response);
      });
    }
  });
});

initialSyncLikes(db.posts);

window.cacheLikeTags = cacheLikeTags;
window.preloadFollowing = preloadFollowing;
