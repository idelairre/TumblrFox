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
    if (this.constants.get('nextBlogSourceSlug')) {
      Object.assign(this.options, this.constants.get('nextBlogSourceSlug'));
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
    this.constants.set('nextBlogSourceSlug', {
      page: this.options.page,
      url: this.options.url
    });
  }

  parse(data) {
    return parsePosts(data);
  }

  async getInfo(user) {
    const deferred = Deferred();
    if (typeof user !== 'string') {
      deferred.reject(`${typeof user === 'object' ? JSON.stringify(user) : user} is not a valid blogname`);
    }
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
    const deferred = Deferred();
    try {
      const tumblelog = await this.getInfo(user);
      const response = {
        user
      };
      if (tumblelog.is_nsfw) {
        response.content_rating = 'nsfw'
      } else {
        response.content_rating = 'safe';
      }
      deferred.resolve(response);
    } catch (e) {
      console.error(e);
      deferred.reject(e);
    }
    return deferred.promise();
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

    if (typeof slug.blogname !== 'string') {
      deferred.reject(slug.blogname, 'is not a valid blogname');
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
      }
    });
    return deferred.promise();
  }
}

const blogSource = new BlogSource();

export default blogSource;
