import constants from '../constants';
import receiverHandler from '../services/receiverService';
import sendMessage from '../services/messageService';
import BlogStore from '../stores/blogStore';
import BlogSource from '../source/blogSource';
import PostSource from '../source/postSource';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';
import { omit } from 'lodash';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
  constants.set('previousVersion',  details.previousVersion);
});

const setConstants = payload => {
  if (typeof payload !== 'undefined') {
    constants.set(omit(payload, ['channels', 'sparkline']));
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
  fetchDashboardPosts: PostSource.fetchDashboardPosts,
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
