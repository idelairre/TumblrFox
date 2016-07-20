import { Deferred } from 'jquery';
import BlogSource from './blogSource';
import { omit, last, replace } from 'lodash';
import { oauthRequest } from '../lib/oauthRequest';
import Source from './source';
import 'babel-polyfill';

class FollowingSource extends Source {
  options = {
    iterator: 'offset',
    item: 'followings',
    url: `https://api.tumblr.com/v2/user/following`,
    limit: 20,
    offset: 0,
    cached: 0,
    total: 0,
    until: false
  }

  constructor() {
    super();
  }

  initializeConstants() {
    this.options.offset = this.constants.get('cachedFollowingCount');
    this.options.total = this.constants.get('totalFollowingCount');
  }

  step() {
    this.options.offset += this.options.limit;
  }

  condition() {
    if (this.options.until) {
      return this.options.offset <= this.options.until;
    }
    return true;
  }

  parse(response) {
    if (this.constants.get('totalFollowingCount') === 0) {
      this.constants.set('totalFollowingCount', response.total_blogs);
    }
    response.blogs = response.blogs.map(following => {
      following.following = true;
      following.avatar_url = replace(following.avatar[1].url, '64', '128');
      following = omit(following, ['avatar', 'can_message', 'share_likes', 'share_following', 'theme']);
      return following;
    });
    return response.blogs;
  }

  async fetch() {
    const deferred = Deferred();
    const slug = {
      url: this.options.url,
      limit: this.options.limit,
      offset: this.options.offset
    };
    try {
      const response = await oauthRequest(slug);
      deferred.resolve(this.parse(response));
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  getInfo(tumblelog) {
    return BlogSource.getInfo(tumblelog);
  }
}

const source = new FollowingSource();

export default source;
