import { Deferred } from 'jquery';
import BlogSource from './blogSource';
import { oauthRequest } from '../lib/oauthRequest';
import Source from './source';
import 'babel-polyfill';

class FollowingSource extends Source {
  options = {
    iterator: 'offset',
    item: 'following',
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
    return response.blogs;
  }

  async fetch() {
    const slug = {
      url: this.options.url,
      limit: this.options.limit,
      offset: this.options.offset
    };
    const response = await oauthRequest(slug);
    return this.parse(response);
  }

  getInfo(tumblelog) {
    return BlogSource.getInfo(tumblelog);
  }
}

const source = new FollowingSource();

export default source;
