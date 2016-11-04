import constants from '../constants';
import receiverHandler from '../services/receiverService';
import sendMessage from '../services/messageService';
import BlogStore from '../stores/blogStore';
import BlogSource from '../source/blogSource';
import PostSource from '../source/postSource';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';
import manifest from '../../manifest.json';

chrome.runtime.onInstalled.addListener(details => { // TODO: move this to background since it has to do with initialization
  console.log('previousVersion', details.previousVersion);
  constants.set('previousVersion', details.previousVersion);
  constants.set('version', manifest.version);
  if (constants.get('previousVersion') !== constants.get('version')) {
    constants.set('firstRun', true);
  }
});

const setConstants = payload => {
  if (typeof payload !== 'undefined') {
    constants.set(payload);
  }
};

const sendConstants = () => {
  return constants.toJSON();
};

constants.on('reset',() => {
  sendMessage(constants.toJSON());
});

const chromeReciever = receiverHandler({
  cacheBlogPosts: BlogStore.cache,
  fetchBlogPosts: BlogSource.fetchBlogPosts,
  fetchCachedBlogPosts: BlogStore.fetch,
  fetchConstants: sendConstants,
  fetchContentRating: BlogSource.getContentRating.bind(BlogSource),
  fetchDashboardPosts: PostSource.filteredFetch,
  fetchFollowing: Following.fetch,
  fetchDashboardPostsByTag: PostSource.fetchDashboardPostsByTag,
  fetchLikedTags: Tags.fetchLikedTags,
  fetchNsfwBlogs: Following.fetchNsfwBlogs,
  fetchTagsByUser: Tags.fetchTagsByUser,
  initializeConstants: setConstants,
  refreshFollowing: Following.refresh,
  searchLikesByTag: Likes.fetch,
  searchLikesByTerm: Likes.searchLikesByTerm,
  setFilter: Likes.setFilter,
  syncLike: Likes.syncLike,
  updateBlogCache: BlogStore.update,
  updateFollowing: Following.update,
  updateLikes: Likes.updateLikes,
  validateCache: BlogStore.validateCache
});

export default chromeReciever;
