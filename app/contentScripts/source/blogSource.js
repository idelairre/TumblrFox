import $ from 'jquery';
import { has, pick } from 'lodash';
import ChromeMixin from '../components/mixins/chromeMixin';
import Source from './source';

const BlogSource = Source.extend({
  mixins: [ChromeMixin],
  initialize() {
    this.rejected = [];
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
        xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
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
        if (tumblelog && !Tumblr.Prima.Models.Tumblelog.collection.findWhere({ name: tumblelog.name })) {
          Tumblr.Prima.Models.Tumblelog.collection.add(new Tumblr.Prima.Models.Tumblelog(tumblelog));
        }
        return posts;
      });
    }
    return this.apiFetch(query);
  },
  clientFetch(query) {
    const slug = {
      tumblelog_name_or_id: query.blogname,
      limit: query.limit,
      offset: query.next_offset
    };

    if (query.postId) {
      slug.post_id = query.postId;
    }

    return $.ajax({ // NOTE: might put this back to the deferred anti-pattern because it makes the $.when.apply($, ...) pattern not work as well
      url: 'https://www.tumblr.com/svc/indash_blog/posts',
      beforeSend: xhr => {
        xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
      },
      data: slug
    });
  },
  search(query) {
    const slug = pick(query, 'next_offset', 'limit', 'sort', 'post_type', 'post_role', 'filter_nsfw');

    return $.ajax({
      type: 'GET',
      url: `https://www.tumblr.com/svc/search/blog_search/${query.blogname}/${query.term}`,
      data: slug,
      beforeSend: xhr => {
        xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
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

    Promise.all(promises).then(posts => {
      deferred.resolve(this._handleCollatedData(posts));
    });

    return deferred.promise();
  },
  _handleCollatedData(data) {
    const deferred = $.Deferred();

    const results = data.map(item => {
      const { posts, tumblelog } = item.response;
      const [post] = posts;
      this._fetchTumblelogs(post);
      return post;
    });

    deferred.resolve(results);

    return deferred.promise();
  },
  _fetchTumblelogs(post) {
    const promises = [];
    const tumblelogs = [];
    const deferred = $.Deferred();

    if (!Tumblr.Prima.Models.Tumblelog.collection.findWhere({ name: post.tumblelog })) {
      promises.push(this.getInfo(post.tumblelog));
    }

    if (post.reblogged_from_name &&
      post.reblogged_from_name !== post.tumblelog &&
      !Tumblr.Prima.Models.Tumblelog.collection.findWhere({ name: post.reblogged_from_name }) &&
      !this.rejected.includes(post.reblogged_from_name)) {
      promises.push(this.getInfo(post.reblogged_from_name));
    }

    if (post.reblogged_root_name &&
      post.reblogged_root_name !== post.reblogged_from_name &&
      post.reblogged_root_name !== post.tumblelog &&
      !Tumblr.Prima.Models.Tumblelog.collection.findWhere({ name: post.reblogged_root_name }) &&
      !this.rejected.includes(post.reblogged_from_name)) {
      promises.push(this.getInfo(post.reblogged_root_name));
    }

    $.when.apply($, promises).then(tumblelog => {
      if (tumblelog) {
        Tumblr.Prima.Models.Tumblelog.collection.add(new Tumblr.Prima.Models.Tumblelog(tumblelog));
        tumblelogs.push(tumblelog);
      }
    }).always(() => deferred.resolve(tumblelogs));
    return deferred.promise();
  }
});

module.exports = new BlogSource();
