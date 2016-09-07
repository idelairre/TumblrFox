import { isEmpty, omit } from 'lodash';
import { Deferred } from 'jquery';
import tokens from '../tokens.json';
import { ChromeExOAuth } from './chromeExOauth';

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

const onAuthorized = (slug, callback) => {
  const request = {
    method: slug.method || 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    parameters: omit(slug, ['method', 'url'])
  };

  oauth.sendSignedRequest(slug.url, function (data, xhr) {
    if (!isEmpty(data)) {
      const response = JSON.parse(data).response;
      callback(null, response);
    } else {
      callback(xhr);
    }
  }, request);
};

export const oauthRequest = slug => {
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
};
