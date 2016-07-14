import BlogStore from '../stores/blogStore';
import LikeStore from '../stores/likeStore';
import constants from '../constants';

const idleService = async state => {
  if (state === 'idle' && constants.initialized && constants.autoCacheUserPosts) {
    const hasCachedUserPosts = await BlogStore.validateCache();
    if (!hasCachedUserPosts) {
      BlogStore.update();
    }
  }
  if (state === 'idle' && constants.initialized && constants.autoCacheLikes) {
    LikeStore.cache();
  }
}

export default idleService;
