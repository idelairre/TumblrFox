import constants from '../constants';
import receiverHandler from '../services/receiverService';
import FuseSearch from '../services/fuseSearchService';
import PostSource from '../source/postSource';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const setConstants = (request, sender, sendResponse) => {
  constants.set('formKey', request.payload.formKey);
}

const sendConstants = (request, sender, sendResponse) => {
  sendResponse(constants);
};

const chromeReciever = receiverHandler({
  initialize: setConstants,
  fetchConstants: sendConstants,
  fetchDashboardPosts: PostSource.send,
  fetchBlogPosts: PostSource.send,
  fetchDashboardPostsByTag: PostSource.send,
  fetchTags: Tags.send,
  searchLikesByTag: Likes.send,
  searchLikesByTerm: Likes.send,
  syncLikes: Likes.sync,
  updateLikes: Likes.update,
  fetchFollowing: Following.send,
  updateFollowing: Following.send
});

export default chromeReciever;
