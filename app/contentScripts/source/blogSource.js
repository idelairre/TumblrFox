module.exports = (function (Tumblr, Backbone, $, _, ChromeMixin, Source) {
  const { extend, pick } = _;
  const { Tumblelog } = Tumblr.Prima.Models;

  const BlogSource = Source.extend({
    mixins: [ChromeMixin],
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
      if (query.term.length === 0 && query.post_type === 'ANY') {
        return this.clientFetch(query).then(data => {
          const { posts, tumblelog } = data.response;
          if (tumblelog) {
            Tumblelog.collection.add(new Tumblelog(tumblelog));
          }
          return posts;
        });
      }
      const deferred = $.Deferred();
      const slug = pick(query, 'blogname', 'next_offset', 'limit', 'sort', 'post_type');
      this.chromeTrigger('chrome:fetch:blogPosts', slug, response => {
        this.collateData(response).then(posts => {
          posts = this._handleCollatedData(posts);
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
        const { posts, tumblelog } = item.response; // TODO: THERE IS A PROBLEM HERE
        if (tumblelog) {
          Tumblelog.collection.add(new Tumblelog(tumblelog));
        }
        results.push(posts[0]);
      });
      return results;
    },
  });

  Tumblr.Fox.register('BlogSource', BlogSource);

});
