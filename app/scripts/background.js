import { ChromeExOAuth } from './lib/chrome_ex_oauth';
import { REQUEST_TOKEN_URL, AUTHORIZATION_BASE_URL, ACCESS_TOKEN_URL, CONSUMER_KEY, CONSUMER_SECRET } from './constants';
import './lib/livereload';

chrome.runtime.onInstalled.addListener((details) => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId) => {
  // chrome.pageAction.show(tabId);
});

const oauth = ChromeExOAuth.initBackgroundPage({
  'request_url': REQUEST_TOKEN_URL,
  'authorize_url': AUTHORIZATION_BASE_URL,
  'access_url': ACCESS_TOKEN_URL,
  'consumer_key': CONSUMER_KEY,
  'consumer_secret': CONSUMER_SECRET,
});

function onAuthorized(slug, callback) {
  console.log(arguments);
  const request = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    parameters: slug
  };

  const url = slug.url || 'https://api.tumblr.com/v2/user/dashboard';

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
