import constants from '../constants';
import portHandler from '../services/portHandler';
import Cache from '../stores/cache';
import Keys from '../stores/keyStore';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const sendConstants = postMessage => {
  postMessage({ type: 'replyConstants', payload: constants });
}

const updateConstants = (request, postMessage) => {
  constants.set(request);
}

const checkLikes = postMessage => {
  Likes.check(constants.get('userName')).then(response => {
    constants.set('canFetchApiLikes', response);
    postMessage({
      type: 'fetchApiLikesStatus',
      payload: constants.canFetchApiLikes
    });
  });
}

const downloadCache = postMessage => {
  if (constants.get('saveViaFirebase')) {
    Cache.uploadCache(postMessage);
  } else {
    Cache.assembleCacheAsCsv(postMessage);
  }
}

const restoreCache = (request, postMessage) => {
  if (constants.get('saveViaFirebase')) {
    Cache.restoreViaFirebase(postMessage);
  } else {
    Cache.restoreCache(request, postMessage);
  }
}

const optionsReceiver = portHandler({
  cacheLikes: Likes.cache,
  cacheTags: Tags.cache,
  cacheFollowing: Following.preload,
  checkLikes: checkLikes,
  downloadCache: downloadCache,
  fetchConstants: sendConstants,
  resetCache: Cache.reset,
  restoreCache: restoreCache,
  updateSettings: updateConstants
});

export default optionsReceiver;
