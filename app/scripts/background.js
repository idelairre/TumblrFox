import { ChromeExOAuth } from './lib/chrome_ex_oauth';
import { REQUEST_TOKEN_URL, AUTHORIZATION_BASE_URL, ACCESS_TOKEN_URL, CONSUMER_KEY, CONSUMER_SECRET } from './constants';
import $ from 'jquery';
import './lib/livereload';

chrome.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId) => {
  chrome.pageAction.show(tabId);
});

const oauth = ChromeExOAuth.initBackgroundPage({
  'request_url': REQUEST_TOKEN_URL,
  'authorize_url': AUTHORIZATION_BASE_URL,
  'access_url': ACCESS_TOKEN_URL,
  'consumer_key': CONSUMER_KEY,
  'consumer_secret': CONSUMER_SECRET,
});

function stringify(parameters) {
  let params = [];
  for (let p in parameters) {
    params.push(encodeURIComponent(p) + '=' + encodeURIComponent(parameters[p]));
  }
  return params.join('&');
};

function onAuthorized(slug, callback) {
  console.log(arguments);
  const params = stringify({
    limit: (typeof slug.limit !== 'undefined' ? slug.limit : 12),
    type: slug.type,
    offset: (typeof slug.offset !== 'undefined' ? slug.offset : null),
    since_id: (typeof slug.sinceId !== 'undefined' ? slug.sinceId : null),
    reblog_info: true,
    notes_info: true
  });

  const request = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    parameters: params
  };

  const url = 'https://api.tumblr.com/v2/user/dashboard';

  oauth.sendSignedRequest(url, (response, xhr) => {
    console.log(JSON.parse(response));
    let posts = JSON.parse(response).response;
    callback(posts);
  }, request);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  oauth.authorize(() => {
    onAuthorized(request.fetchPost, (response) => {
      sendResponse({ posts: response.posts });
    });
  });
  return true;
});
