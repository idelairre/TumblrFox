import constants from '../constants';
import db from '../lib/db';
import { oauthRequest } from '../lib/oauthRequest';
import 'babel-polyfill';

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
};

export default loadUser;
