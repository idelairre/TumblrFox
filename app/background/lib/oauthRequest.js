import { defaults, omit } from 'lodash';
import $, { Deferred } from 'jquery';
import qs from 'qs';
import OAuthSimple from './chromeExOauthsimple';
import constants from '../constants';
import tokens from '../tokens.json';

const REQUEST_TOKEN_URL = 'https://www.tumblr.com/oauth/request_token';
const AUTHORIZATION_BASE_URL = 'https://www.tumblr.com/oauth/authorize';
const ACCESS_TOKEN_URL = 'https://www.tumblr.com/oauth/access_token';

const CONSUMER_KEY = tokens.consumerKey;
const CONSUMER_SECRET = tokens.consumerSecret;

const token = {
  key: CONSUMER_KEY,
  secret: CONSUMER_SECRET
};

let authFlowStarted = false;

const setTokenSecret = tokenSecret => {
  localStorage['token_secret'] = tokenSecret;
}

const getTokenSecret = () => localStorage['token_secret'];

const getOAuthToken = () => localStorage['oauth_token'];

const setOAuthToken = oauthToken => {
  localStorage['oauth_token'] = oauthToken;
}

const clearTokens = () => {
  delete localStorage['oauth_token'];
  delete localStorage['token_secret'];
}

const hasTokens = () => !!(getOAuthToken() && getTokenSecret());

const getRequestTokens = async () => {
  const OAuthSimpleInstance = new OAuthSimple();
  const result = OAuthSimpleInstance.sign({
    path: REQUEST_TOKEN_URL,
    parameters: {
      oauth_callback: 'https://example.com/'
    },
    signatures: {
      consumer_key: CONSUMER_KEY,
      shared_secret: CONSUMER_SECRET
    }
  });

  const response = await $.ajax({
    url: result.signed_url,
    method: 'GET'
  });

  console.log(response);

  return qs.parse(response);
}

const authorize = oauthResponse => {
  return browser.tabs.create({
    url: AUTHORIZATION_BASE_URL + '?oauth_token=' + oauthResponse.oauth_token,
    active: true
  });
}

const verifyToken = tab => {
  const deferred = Deferred();
  const currentTabId = tab.id;
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (currentTabId === tabId && changeInfo.url && !/^https:\/\/www\.tumblr\.com\/oauth\/authorize?.*/.test(changeInfo.url)) {
      browser.tabs.remove([tabId]);
      // const test = ChromeExOAuth.formDecode(changeInfo.url.split("?").slice(1).join("?"));
      const matched = changeInfo.url.match(/(oauth_token)=([a-zA-Z0-9]+).+(oauth_verifier)=([a-zA-Z0-9]+)#_=_$/);
      const params = Array.isArray(matched) ? { oauth_token: matched[2], oauth_verifier: matched[4] } : null;
      deferred.resolve(params);
    }
  });
  return deferred.promise();
}

const getAccessTokens = async ({ oauth_token_secret }, { oauth_token, oauth_verifier }) => {
  const OAuthSimpleInstance = new OAuthSimple();
  const result = OAuthSimpleInstance.sign({
    action: 'POST',
    path: ACCESS_TOKEN_URL,
    parameters: {
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier
    },
    signatures: {
      consumer_key: CONSUMER_KEY,
      shared_secret: CONSUMER_SECRET,
      oauth_secret: oauth_token_secret
    }
  });
  const request = {
    url: result.signed_url,
    method: 'POST'
  };

  const response = await $.ajax(request);

  return qs.parse(response);
}

const signURL = (url, method = 'GET', params = {}) => {
  const token = getOAuthToken();
  const secret = getTokenSecret();

  if (!token || !secret) {
    throw new Error('No oauth token or token secret');
  }

  const OAuthSimpleInstance = new OAuthSimple();
  const result = OAuthSimpleInstance.sign({
    action: method,
    path: url,
    parameters: params,
    signatures: {
      consumer_key: CONSUMER_KEY,
      shared_secret: CONSUMER_SECRET,
      oauth_secret: secret,
      oauth_token: token
    }
  });

  return result.signed_url;
}

const initOAuth = async () => {
  if (hasTokens() || authFlowStarted) {
    return;
  }

  try {
    authFlowStarted = true;

    const reqTokens = await getRequestTokens();
    const tab = await authorize(reqTokens);
    const oauthTokens = await verifyToken(tab);
    const { oauth_token, oauth_token_secret } = await getAccessTokens(reqTokens, oauthTokens);
    
    setOAuthToken(oauth_token);
    setTokenSecret(oauth_token_secret);

    authFlowStarted = false;

    return Deferred().resolve();
  } catch (err) {
    console.error(err);
  }
}

// clearTokens();
initOAuth();

export const oauthRequest = async slug => {
  if (!hasTokens()) {
    await initOAuth();
  }

  const deferred = Deferred();
  const params = omit(slug, ['method', 'url']);
  const url = signURL(slug.url, 'GET', params);

  try {
    const { response } = await $.get(url);
    console.log(response);
    deferred.resolve(response);
  } catch (err) {
    console.error(err);
    deferred.reject(err);
  }

  return deferred.promise();
}
