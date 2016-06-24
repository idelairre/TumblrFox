import constants from '../constants';
import receiverHandler from '../services/receiverService';
import FuseSearch from '../services/fuseSearchService';
import PostSource from '../source/postSource';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const setConstants = payload => {
  constants.set('formKey', payload.formKey);
};

const sendConstants = () => {
  return constants;
};

const chromeReciever = receiverHandler({
  initialize: setConstants,
  fetchConstants: sendConstants,
  fetchDashboardPosts: PostSource.fetchDashboardPosts,
  fetchBlogPosts: PostSource.fetchBlogPosts,
  fetchDashboardPostsByTag: PostSource.fetchDashboardPostsByTag,
  fetchLikedTags: Tags.fetchLikedTags,
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
