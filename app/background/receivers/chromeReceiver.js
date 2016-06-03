import constants from '../constants';
import receiverHandler from '../services/receiverHandler';
import FuseSearch from '../services/fuseSearch';
import PostSource from '../source/postSource';
import Tags from '../stores/tagStore';
import Likes from '../stores/likeStore';
import Following from '../stores/followingStore';

const sendConstants = (request, sender, sendResponse) => {
  sendResponse(constants);
}

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
  updateFollowing: Following.sync
});

export default chromeReciever;
