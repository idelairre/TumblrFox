import { Deferred } from 'jquery';
import { isError } from 'lodash';
import { ChromeExOAuth } from './chromeExOauth';
import tokens from '../tokens.json';

const REQUEST_TOKEN_URL = 'https://www.tumblr.com/oauth/request_token';
const AUTHORIZATION_BASE_URL = 'https://www.tumblr.com/oauth/authorize';
const ACCESS_TOKEN_URL = 'https://www.tumblr.com/oauth/access_token';

const CONSUMER_KEY = tokens.consumerKey;
const CONSUMER_SECRET = tokens.consumerSecret;

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

  oauth.sendSignedRequest(url, function (data, xhr) {
    // console.log('[OAUTH]', arguments);
    if (data !== '') {
      // console.log('[RESPONSE BYTES]', (encodeURI(data).split(/%..|./).length - 1)/ 1024);
      const response = JSON.parse(data).response;
      callback(null, response);
    } else {
      callback(new Error('Response was empty'));
    }
  }, request);
}

export function oauthRequest(slug) {
  const deferred = Deferred();
  oauth.authorize(() => {
    onAuthorized(slug, (error, response) => {
      if (error) {
        deferred.reject(error);
      } else {
        deferred.resolve(response);
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
