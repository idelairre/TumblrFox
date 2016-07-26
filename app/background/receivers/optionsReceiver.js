import constants from '../constants';
import portHandler from '../services/portService';
import Blog from '../stores/blogStore';
import Cache from '../services/cacheService';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const sendConstants = postMessage => {
  postMessage({
    type: 'replyConstants',
    payload: constants.toJSON()
  });
};

const updateConstants = request => {
  constants.set(request);
};

const downloadCache = postMessage => {
  if (constants.get('saveViaFirebase')) {
    Cache.uploadCache(postMessage);
  } else {
    Cache.assembleCacheAsCsv(postMessage);
  }
};

const restoreCache = (request, postMessage) => {
  if (constants.get('saveViaFirebase')) {
    postMessage = request;
    Cache.restoreViaFirebase(postMessage);
  } else {
    Cache.restoreCache(request, postMessage);
  }
};

const runTests = () => {
  chrome.tabs.create({
    url: chrome.extension.getURL('pages/tests.html')
  });
}

const log = request => {
  console.log(request);
}

const optionsReceiver = portHandler({
  log: log,
  cachePosts: Blog.cache,
  cacheLikes: Likes.cache,
  cacheFollowing: Following.cache,
  downloadCache: downloadCache,
  fetchConstants: sendConstants,
  rehashTags: Cache.rehashTags,
  resetCache: Cache.reset,
  restoreCache: restoreCache,
  runTests: runTests,
  updateSettings: updateConstants
});

export default optionsReceiver;
