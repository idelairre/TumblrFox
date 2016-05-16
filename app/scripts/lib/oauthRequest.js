import { Deferred } from 'jquery';
import constants from '../constants';
import { ChromeExOAuth } from './chromeExOauth';

const ACCESS_TOKEN_URL = constants.accessTokenUrl;
const CONSUMER_KEY = constants.consumerKey
const CONSUMER_SECRET = constants.consumerSecret;
const REQUEST_TOKEN_URL = constants.requestTokenUrl;
const AUTHORIZATION_BASE_URL = constants.authorizationBaseUrl;

const oauth = ChromeExOAuth.initBackgroundPage({
  request_url: REQUEST_TOKEN_URL,
  authorize_url: AUTHORIZATION_BASE_URL,
  access_url: ACCESS_TOKEN_URL,
  consumer_key: CONSUMER_KEY,
  consumer_secret: CONSUMER_SECRET
});

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

export function oauthRequest(slug) {
  const deferred = Deferred();
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

export function resetOauthSlug(slug) {
  for (const key in slug) {
    if ({}.hasOwnProperty.call(slug, key)) {
      if (key.includes('oauth')) {
        delete slug[key];
      }
    }
  }
}
