import $ from 'jquery';
import { has, pick } from 'lodash';
import ChromeMixin from '../components/mixins/chromeMixin';
import Source from './source';

const BlogSource = Source.extend({
  mixins: [ChromeMixin],
  initialize() {
    this.rejected = [];
  },
  addBlog(tumblelog) {
    Tumblr.Prima.Models.Tumblelog.collection.add(new Tumblr.Prima.Models.Tumblelog(tumblelog));
  },
  getBlog(name) {
    return Tumblr.Prima.Models.Tumblelog.collection.findWhere({ name });
  },
  getInfo(blogname) {
    const deferred = $.Deferred();

    if (this.rejected.includes(blogname)) {
      deferred.reject(`${blogname} is deactivated or inaccessable`);
    }

    if (blogname.match(/-deact/g)) {
      // TODO: send this to backend and delete user if following
      this.rejected.push(blogname);
      deferred.reject(`${blogname} is deactivated`);
    }

    $.ajax({
      type: 'GET',
      url: 'https://www.tumblr.com/svc/data/tumblelog',
      beforeSend: xhr => {
        xhr.setRequestHeader('X-tumblr-form-key', Tumblr.Fox.constants.formKey);
      },
      data: {
        tumblelog: blogname
      },
      timeout: 3000,
      success: data => {
        const tumblelog = data.response;
        deferred.resolve(tumblelog);

        if (tumblelog.following) {
          this.update(tumblelog);
        }
      },
      error: error => {
        deferred.reject(error);
        this.rejected.push(blogname);
      }
    });
    return deferred.promise();
  },
  getContentRating(tumblelog) {
    const deferred = $.Deferred();

    this.chromeTrigger('chrome:fetch:contentRating', tumblelog, response => {
      if (response) {
        deferred.resolve(response);
      } else {
        deferred.reject(`cannot get content rating for ${tumblelog}`);
      }
    });

    return deferred.promise();
  },
  update(following) {
    this.chromeTrigger('chrome:update:following', following);
  },
  updateBlogCache() {
    this.chromeTrigger('chrome:update:blogCache');
  },
  apiFetch(query) {
    const deferred = $.Deferred();
    const slug = pick(query, 'blogname', 'next_offset', 'limit', 'sort', 'post_type', 'filter_nsfw');

    this.chromeTrigger('chrome:fetch:blogPosts', slug, response => {
      this.collateData(response).then(deferred.resolve);
    });
    return deferred.promise();
  },
  cacheFetch(query) {
    delete query.blog;
    const deferred = $.Deferred();
    this.chromeTrigger('chrome:fetch:cachedBlogPosts', query, deferred.resolve);
    return deferred.promise();
  },
  fetch(query) {
    if (query.post_type === 'ANY' && (!query.term || query.term.length === 0)) {
      return this.clientFetch(query).then(data => {
        const { posts, tumblelog } = data.response;
        if (tumblelog && !this.getBlog(tumblelog.name)) {
          this.addBlog(tumblelog);
        }
        return posts;
      });
    }
    return this.apiFetch(query);
  },
  clientFetch(query) {
    const deferred = $.Deferred();

    const slug = {
      tumblelog_name_or_id: query.blogname,
      post_id: query.postId || '',
      limit: query.limit,
      offset: query.offset || query.next_offset,
      should_bypass_safemode: false
    };

    if (!this.getBlog(query.blogname)) {
      this.getInfo(query.blogname).then(this.addBlog);
    }

    $.ajax({ // NOTE: might put this back to the deferred anti-pattern because it makes the $.when.apply($, ...) pattern not work as well
      url: 'https://www.tumblr.com/svc/indash_blog',
      beforeSend: xhr => {
        xhr.setRequestHeader('X-tumblr-form-key', Tumblr.Fox.constants.formKey);
      },
      data: slug,
      success: data => deferred.resolve(data),
      error: error => deferred.reject(error)
    });

    return deferred.promise();
  },
  search(query) {
    const slug = pick(query, 'next_offset', 'limit', 'sort', 'post_type', 'post_role', 'filter_nsfw');

    return $.ajax({
      type: 'GET',
      url: `https://www.tumblr.com/svc/search/blog_search/${query.blogname}/${query.term}`,
      data: slug,
      beforeSend: xhr => {
        xhr.setRequestHeader('X-tumblr-form-key', Tumblr.Fox.constants.formKey);
      },
      timeout: 3000
    });
  },
  collateData(posts) {
    const deferred = $.Deferred();

    if (typeof posts === 'undefined' || !Array.isArray(posts)) {
      return deferred.reject('cannot collate, posts are undefined or are not an array');
    }

    const promises = posts.map(post => {
      return this.clientFetch({
        blogname: post.blog_name,
        postId: post.id,
        limit: 1,
        offset: 0
      });
    });

    Promise.all(promises).then(response => {
      deferred.resolve(this._handleCollatedData(response));
    }).catch(console.error);

    return deferred.promise();
  },
  _handleCollatedData(data) {
    return data.map(item => {
      const { posts } = item.response;
      const [post] = posts;
      this._fetchTumblelogs(post);
      return post;
    });
  },
  _fetchTumblelogs(post) {
    const promises = [];
    const tumblelogs = [];
    const deferred = $.Deferred();

    // if its not reblogged from itself and its not stored in collections or on the rejected list
    if (has(post, 'reblogged_from_name') &&
      post.reblogged_from_name !== post.tumblelog &&
      !this.getBlog(post.reblogged_from_name) &&
      !this.rejected.includes(post.reblogged_from_name)) {
      promises.push(this.getInfo(post.reblogged_from_name));
    }

    // if the root blog is not the same blog as its reblogged from and the root blog is not the source of the post
    if (has(post,'reblogged_root_name') &&
      post.reblogged_root_name !== post.reblogged_from_name &&
      post.reblogged_root_name !== post.tumblelog &&
      !this.getBlog(post.reblogged_root_name) &&
      !this.rejected.includes(post.reblogged_from_name)) {
      promises.push(this.getInfo(post.reblogged_root_name));
    }

    $.when.apply($, promises).then(tumblelog => {
      if (tumblelog) {
        this.addBlog(tumblelog);
        tumblelogs.push(tumblelog);
      }
    }).always(() => deferred.resolve(tumblelogs));
    return deferred.promise();
  }
});

module.exports = new BlogSource();
