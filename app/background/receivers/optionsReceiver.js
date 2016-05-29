import constants from '../constants';
import portHandler from '../services/portHandler';
import Keys from '../stores/keyStore';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const sendConstants = postMessage => {
  postMessage({ type: 'replyConstants', payload: constants });
}

const updateConstants = request => {
  constants.set(request.payload);
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
    if (constants.get('saveAsCsv')) {
      Cache.assembleCacheAsCsv(postMessage);
    } else {
      Cache.assembleCacheAsJson(postMessage);
    }
  }
}

const restoreCache = (request, postMessage) => {
  if (constants.get('saveViaFirebase')) {
    Cache.restoreViaFirebase(postMessage);
  } else {
    Cache.restoreCache(request.payload, postMessage); // restore file, parse everything all at once, add posts one at a time
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
  updateSettings: updateConstants
});

export default optionsReceiver;
