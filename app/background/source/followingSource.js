import { Deferred } from 'jquery';
import { omit, replace } from 'lodash';
import sanitizeHtml from 'sanitize-html';
import Source from 'tumblr-source';
import { oauthRequest } from '../lib/oauthRequest';
import BlogSource from './blogSource';
import constants from '../constants';
import fetch from '../utils/fetch';

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

  load() {
    this.constants = constants;
    constants.once('ready', () => {
      Object.assign(this.options, this.constants.get('cachedFollowingCount'));
      Object.assign(this.options, this.constants.get('totalFollowingCount'));
    });
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
    return response.blogs = response.blogs.map(following => {
      following.following = true;
      following.avatar_url = replace(following.avatar[1].url, '64', '128');
      following.description = sanitizeHtml(following.description, {
        allowedTags: []
      });
      return omit(following, ['avatar', 'can_message', 'share_likes', 'share_following', 'theme']); // NOTE: descriptions are not sanitized which can result in fucky json
    });
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
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise();
  }

  getInfo(tumblelog) {
    return BlogSource.getInfo(tumblelog);
  }
}

const source = new FollowingSource();

export default source;
