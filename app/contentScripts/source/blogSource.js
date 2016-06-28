module.exports = (function dashboardSource(Tumblr, Backbone, _) {
  const { $ } = Backbone;
  const { extend, pick } = _;
  const { get } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  const BlogSource = function () { };

  extend(BlogSource.prototype, {
    getInfo(blogname) {
      const deferred = $.Deferred();
      const slug = {
        tumblelog: blogname
      };
      $.ajax({
        type: 'GET',
        url: 'https://www.tumblr.com/svc/data/tumblelog',
        beforeSend: xhr => {
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        data: slug,
        success: data => {
          deferred.resolve(data.response);
        },
        error: error => {
          deferred.reject(error);
        }
      });
      return deferred.promise();
    },
    fetch(query) {
      if (!query.term || (query.term && query.term.length === 0) && query.post_type === 'ANY') {
        return this.clientFetch(query);
      }
      const deferred = $.Deferred();
      const slug = pick(query, 'blogname', 'next_offset', 'limit', 'sort', 'post_type');
      this.chromeTrigger('chrome:fetch:blogPosts', slug, response => {
        this.collateData(response).then(data => {
          const posts = this._handleCollatedData(data.response.posts);
          deferred.resolve(posts);
        });
      });
      return deferred.promise();
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
      const deferred = $.Deferred();
      $.ajax({
        url: 'https://www.tumblr.com/svc/indash_blog/posts',
        beforeSend: xhr => {
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        data: slug,
        success: data => {
          deferred.resolve(data);
        },
        fail: error => {
          deferred.reject(error);
        }
      });
      return deferred.promise();
    },
    search(query) {
      const slug = pick(query, 'next_offset', 'limit', 'sort', 'post_type', 'post_role', 'filter_nsfw');
      const deferred = $.Deferred();
      $.ajax({
        type: 'GET',
        url: `https://www.tumblr.com/svc/search/blog_search/${query.blogname}/${query.term}`,
        data: slug,
        beforeSend: xhr => {
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        success: data => {
          deferred.resolve(data);
        },
        error: error => {
          deferred.reject(error);
        }
      });
      return deferred.promise();
    },
    collateData(posts) {
      const deferred = $.Deferred();
      const promises = posts.map(post => {
        return this.clientFetch({
          blogname: post.blog_name,
          postId: post.id,
          limit: 1,
          offset: 0
        });
      });
      $.when.apply($, promises).done((...posts) => {
        deferred.resolve([].concat(...posts));
      });
      return deferred.promise();
    },
    _handleCollatedData(data) {
      const results = [];
      data.forEach(item => {
        const { posts, tumblelog } = item.response;
        Tumblelog.collection.add(new Tumblelog(tumblelog));
        console.log(tumblelog);
        results.push(posts[0]);
      });
      return results;
    },
  });

  ChromeMixin.applyTo(BlogSource.prototype);

  Tumblr.Fox.register('BlogSource', BlogSource);
});
