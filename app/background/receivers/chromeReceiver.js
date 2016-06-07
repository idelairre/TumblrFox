import constants from '../constants';
import receiverHandler from '../services/receiverService';
import FuseSearch from '../services/fuseSearchService';
import PostSource from '../source/postSource';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const sendConstants = (request, sender, sendResponse) => {
  sendResponse(constants);
};

const chromeReciever = receiverHandler({
  fetchConstants: sendConstants,
  fetchPosts: PostSource.fetch,
  fetchTags: Tags.send,
  searchLikesByTag: Likes.send,
  searchLikesByTerm: Likes.send,
  syncLikes: Likes.sync,
  updateLikes: Likes.update,
  searchSetBlog: FuseSearch.setBlog,
  fetchFollowing: Following.send,
  updateFollowing: Following.send
});

export default chromeReciever;
