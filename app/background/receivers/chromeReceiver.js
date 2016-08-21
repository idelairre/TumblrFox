import constants from '../constants';
import receiverHandler from '../services/receiverService';
import sendMessage from '../services/messageService';
import BlogStore from '../stores/blogStore';
import BlogSource from '../source/blogSource';
import { oauthRequest } from '../lib/oauthRequest';
import PostSource from '../source/postSource';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const loadUser = async () => {
  try {
    const response = await oauthRequest({
      url: 'https://api.tumblr.com/v2/user/info'
    });
    const likesCount = await db.likes.toCollection().count();
    const postsCount = await db.posts.toCollection().count();
    constants.set('userName', response.user.name);
    constants.set('cachedLikesCount', likesCount);
    constants.set('cachedPostsCount', postsCount);
    constants.set('totalLikesCount', response.user.likes);
    constants.set('totalPostsCount', response.user.blogs[0].posts);
    constants.set('totalFollowingCount', response.user.following);
  } catch (err) {
    console.error(err);
  }
}

chrome.runtime.onStartup.addListener(loadUser());

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
  constants.set('previousVersion',  details.previousVersion);
  constants.set('version', chrome.runtime.getManifest().version);
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
