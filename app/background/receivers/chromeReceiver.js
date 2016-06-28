import constants from '../constants';
import receiverHandler from '../services/receiverService';
import FuseSearch from '../services/fuseSearchService';
import PostSource from '../source/postSource';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
  // constants.set('version', details.previousVersion);
});

const setConstants = payload => {
  if (typeof payload !== 'undefined') {
    constants.set(payload);
  }
};

const sendConstants = () => {
  return constants;
};

const chromeReciever = receiverHandler({
  initializeConstants: setConstants,
  fetchConstants: sendConstants,
  fetchDashboardPosts: PostSource.fetchDashboardPosts,
  fetchBlogPosts: PostSource.fetchBlogPosts,
  fetchDashboardPostsByTag: PostSource.fetchDashboardPostsByTag,
  fetchLikedTags: Tags.fetchLikedTags,
  fetchNsfwBlogs: Following.fetchNsfwBlogs,
  fetchTagsByUser: Tags.fetchTagsByUser,
  setFilter: Likes.setFilter,
  searchLikesByTag: Likes.searchLikesByTag,
  searchLikesByTerm: Likes.searchLikesByTerm,
  syncLike: Likes.syncLike,
  updateLikes: Likes.updateLikes,
  fetchFollowing: Following.fetch,
  updateFollowing: Following.update
});

export default chromeReciever;
