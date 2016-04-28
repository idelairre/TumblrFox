import { ChromeExOAuth } from './lib/chrome_ex_oauth';
import { AUTHORIZATION_BASE_URL, ACCESS_TOKEN_URL, REQUEST_TOKEN_URL } from './constants';
import $ from 'jquery'
import './lib/livereload';

let oauth = {};

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener(tabId => {
  // chrome.pageAction.show(tabId);
});

function stringify(parameters) {
  let params = [];
  for (let p in parameters) {
    params.push(encodeURIComponent(p) + '=' + encodeURIComponent(parameters[p]));
  }
  return params;
}

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

function sendSignedRequest(slug, callback) {
  chrome.storage.sync.get({
    consumerKey: ''
  }, items => {
    const url = `https://api.tumblr.com/v2/blog/${slug.blogname}.tumblr.com/posts${slug.type ? '/' + slug.type : ''}`;
    const params = stringify({
      api_key: items.consumerKey
    });
    console.log('[QUERY]', `${url}?${params}`);
    let request = $.ajax({
      url: `${url}?${params}`,
      data: {
        limit: slug.limit || 8,
        offset: slug.offset || 0
      }
    });
    request.always(data => {
      console.log(data);
      callback(data.response);
    });
    request.error(console.error.bind(console, '[ERROR]'));
  });
}

function onAuthorized(slug, callback) {
  console.log(arguments);
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
    const posts = JSON.parse(data).response;
    callback(posts);
  }, request);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  if (request.fetchPosts) {
    oauth.authorize(() => {
      onAuthorized(request.fetchPosts, response => {
        sendResponse({ posts: response.posts });
      });
    });
  } else if (request.fetchBlogPosts) {
    sendSignedRequest(request.fetchBlogPosts, response => {
      sendResponse(response);
    })
  }
  return true;
});
