import { oauthRequest } from '../lib/oauthRequest';
import { ajax, Deferred } from 'jquery';
import parsePosts from '../utils/parsePosts';
import LikeSource from './likeSource';
import tokens from '../tokens.json';
import Source from './source';

class BlogSource extends Source {
  options = {
    page: 0,
    iterator: 'page',
    item: 'blog posts',
    url: null,
    until: false
  }

  constructor() {
    super();
  }

  initializeConstants() {
    if (this.constants.get('nextBlogSlug')) {
      Object.assign(this.options, this.constants.get('nextBlogSlug'));
    }
    if (!this.options.url) {
      this.options.url = `https://www.tumblr.com/blog/${this.constants.get('userName')}`;
    }
  }

  condition() {
    if (this.options.until) {
      return this.options.page <= this.options.until;
    }
    return true;
  }

  step() {
    this.options.page += 1;
    this.options.url = `https://www.tumblr.com/blog/${this.constants.get('userName')}/${this.options.page}`;
    this.constants.set('nextBlogSlug', {
      page: this.options.page,
      url: this.options.url
    });
  }

  parse(data) {
    return parsePosts(data);
  }

  async getInfo(user) {
    const deferred = Deferred();
    ajax({
      type: 'GET',
      url: `https://api.tumblr.com/v2/blog/${user}.tumblr.com/info?api_key=${this.constants.get('consumerKey')}`,
      success: data => {
        deferred.resolve(data.response.blog);
      },
      error: e => {
        deferred.reject(e);
      }
    });
    return deferred.promise();
  }

  async getContentRating(user) {
    try {
      const tumblelog = await this.getInfo(user);
      const response = {
        user
      };
      if (!tumblelog) {
        response.content_rating = 'user has no rating';
      }
      if (tumblelog.is_nsfw) {
        response.content_rating = 'nsfw'
      } else {
        response.content_rating = 'safe';
      }
      return response;
    } catch (e) {
      console.error(e);
      return e;
    }
  }

  async fetchBlogPosts(request) {
    const deferred = Deferred();
    const slug = {
      blogname: request.blogname,
      offset: request.next_offset || 0,
      limit: 10 || request.limit,
    };
    if (typeof request.post_type !== 'undefined') {
      slug.type = request.post_type.toLowerCase();
    }

    let url = `https://api.tumblr.com/v2/blog/${slug.blogname}/posts`;

    if (slug.type) {
      url += `/${slug.type}`;
    }
    url += `?api_key=${tokens.consumerKey}`;
    delete slug.blogname;

    ajax({
      type: 'GET',
      url,
      data: slug,
      success: data => {
        deferred.resolve(data.response.posts);
      },
      error: error => {
        deferred.reject(error);
        console.error(error, slug.blogname);
      }
    });
    return deferred.promise();
  }
}

const blogSource = new BlogSource();

export default blogSource;
