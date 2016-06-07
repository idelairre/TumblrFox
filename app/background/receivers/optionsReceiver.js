import constants from '../constants';
import portHandler from '../services/portService';
import Cache from '../services/cacheService';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const sendConstants = postMessage => {
  postMessage({ type: 'replyConstants', payload: constants });
};

const updateConstants = (request, postMessage) => {
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

const optionsReceiver = portHandler({
  cacheLikes: Likes.cache,
  cacheFollowing: Following.cache,
  downloadCache: downloadCache,
  fetchConstants: sendConstants,
  resetCache: Cache.reset,
  restoreCache: restoreCache,
  updateSettings: updateConstants
});

export default optionsReceiver;
