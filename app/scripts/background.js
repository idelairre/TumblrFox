import { ChromeExOAuth } from './lib/chrome_ex_oauth';
import { AUTHORIZATION_BASE_URL, ACCESS_TOKEN_URL, REQUEST_TOKEN_URL } from './constants';
import $ from 'jquery'
// import Backbone from 'backbone';
import { countBy, debounce, identity, uniq } from 'lodash';
import async from 'async';
import './lib/livereload';

// TODO: add method to update cache on boot

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

let likedPostsCount = 17401;

function cacheLikeTags(callback) {
  chrome.storage.local.get({ posts: [] }, items => {
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

function preloadLikes(callback) {
  let slug = {
    blogname: 'luxfoks',
    limit: 50
  };
  chrome.storage.local.get({ posts: [] }, items => {
    console.log('[POSTS COUNT]', items.posts.length);
    populatePostCache(slug, items, callback)
  });
}

function populatePostCache(slug, items, callback) {
  async.whilst(() => {
    return likedPostsCount === null || likedPostsCount > (items.posts.length - 1);
  }, next => {
    if (likedPostsCount !== null && (likedPostsCount - (items.posts.length - 1)) < slug.limit) {
      slug.limit = (likedPostsCount - (items.posts.length - 1));
    }
    if (items.posts.length !== 0) {
      slug.before = items.posts[items.posts.length - 1].liked_timestamp;
    }
    debounce(fetchLikedPosts, 0).call(this, slug, response => {
      if (likedPostsCount === null) {
        likedPostsCount = response.liked_count;
      }
      items.posts = items.posts.concat(response.liked_posts);
      chrome.storage.local.set({ posts: items.posts });
      let percentComplete = Math.round(((items.posts.length - 1) / likedPostsCount) * 100);
      percentComplete = (percentComplete > 100 ? 100 : percentComplete);
      callback(percentComplete);
      next();
    });
    chrome.storage.local.get({ posts: [] }, items => {
      console.log('[POSTS]', items.posts.length);
    });
  }, (...errors) => {
    console.error('[ERROR]', ...errors);
    callback(...errors)
  });
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
    request.fail((...errors) => {
      throw new Error(...errors);
    });
  });
}

function searchLikes(args, callback) {
  console.log('[SEARCH LIKES]', args);
  chrome.storage.local.get({ posts: [] }, items => {
    let term = (typeof args === 'string' ? args : args.term);
    let matches = items.posts.filter(post => {
      if (post.tags.indexOf(term) > -1) {
        return post;
      }
    });
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

  const url = 'https://api.tumblr.com/v2/user/dashboard';

  oauth.sendSignedRequest(url, (data, xhr) => {
    console.log(JSON.parse(data));
    const posts = JSON.parse(data).response.posts;
    callback({ posts: posts });
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
