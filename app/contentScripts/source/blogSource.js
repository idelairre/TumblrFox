module.exports = (function (Tumblr, Backbone, $, _, ChromeMixin, Source) {
  const { extend, first, pick } = _;
  const { Tumblelog } = Tumblr.Prima.Models;

  const BlogSource = Source.extend({
    mixins: [ChromeMixin],
    getInfo(blogname) {
      const deferred = $.Deferred();

      if (blogname.includes('-deact')) {
        if (Tumblr.Fox.options.get('logging')) {
          console.warn(blogname, 'is deactivated');
        }
        return deferred.reject();
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
        success: data => {
          const tumblelog = data.response;
          deferred.resolve(tumblelog);
          if (tumblelog.following) {
            this.update(tumblelog);
          }
        },
        error: error => {
          deferred.reject(error);
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
          deferred.reject();
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
    cacheFetch(query) {
      delete query.blog;
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:cachedBlogPosts', query, response => {
        deferred.resolve(response);
      });
      return deferred.promise();
    },
    fetch(query) {
      if (query.post_type === 'ANY' && (!query.term || query.term.length === 0)) {
        return this.clientFetch(query).then(data => {
          const { posts, tumblelog } = data.response;
          if (tumblelog && !Tumblelog.collection.findWhere({ name: tumblelog.name })) {
            Tumblelog.collection.add(new Tumblelog(tumblelog));
          }
          return posts;
        });
      }
      const deferred = $.Deferred();
      const slug = pick(query, 'blogname', 'next_offset', 'limit', 'sort', 'post_type', 'filter_nsfw');
      this.chromeTrigger('chrome:fetch:blogPosts', slug, response => {
        this.collateData(response).then(posts => {
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
        deferred.resolve(this._handleCollatedData([].concat(...posts)));
      });
      return deferred.promise();
    },
    _handleCollatedData(data) {
      const deferred = $.Deferred();
      const results = [];
      data.forEach(item => {
        const { posts, tumblelog } = item.response;
        const post = first(posts);
        this._fetchTumblelogs(post);
        results.push(post);
      });
      deferred.resolve(results);
      return deferred.promise();
    },
    _fetchTumblelogs(post) {
      const promises = [];
      const deferred = $.Deferred();
      if (!Tumblelog.collection.findWhere({ name: post.tumblelog })) {
        promises.push(this.getInfo(post.tumblelog).then(response => {
          Tumblelog.collection.add(new Tumblelog(response));
        }));
      }
      if (post.reblogged_from_name && post.reblogged_from_name !== post.tumblelog && !Tumblelog.collection.findWhere({ name: post.reblogged_from_name })) {
        promises.push(this.getInfo(post.reblogged_from_name).then(response => {
          Tumblelog.collection.add(new Tumblelog(response));
        }));
      }
      if (post.reblogged_root_name && post.reblogged_root_name !== post.reblogged_from_name && post.reblogged_root_name !== post.tumblelog && !Tumblelog.collection.findWhere({ name: post.reblogged_root_name })) {
        promises.push(this.getInfo(post.reblogged_root_name).then(response => {
          Tumblelog.collection.add(new Tumblelog(response));
        }));
      }
      $.when.apply($, promises).done(() => {
        deferred.resolve();
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('BlogSource', BlogSource);

});
