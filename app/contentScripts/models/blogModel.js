module.exports = (function blogModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, each, extend, omit } = _;
  const { get, Posts, Utils } = Tumblr.Fox;
  const { Tumblelog } = Tumblr.Prima.Models;
  const PeeprPostsModel = get('PeeprPostsModel');
  const ChromeMixin = get('ChromeMixin');

  const BlogModel = Model.extend({
    mixins: [ChromeMixin],
    initialize(e) {
      this.blogSearch = e.blogSearch;
      this.attributes = this.blogSearch.attributes;
      this.blogPosts = new PeeprPostsModel();
      this.blogPosts.blogNameOrId = this.blogSearch.get('blogname');
      this.blogPosts.stopListening();
      this.attributes = {};
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(this.blogSearch, 'change:blogname', () => {
        this.blogPosts.blogNameOrId = this.blogSearch.get('blogname');
      });
      this.listenTo(this.blogSearch, 'change', () => {
        this.set(this.blogSearch.attributes);
      });
      this.listenTo(Tumblr.Events, 'indashblog:search:post-added', Utils.PostFormatter.renderPost);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.unbindEvents);
    },
    unbindEvents() {
      this.stopListening();
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.bindEvents);
    },
    search() {
      const deferred = $.Deferred();
      deferred.resolve(this.blogSearch.fetch());
      return deferred.promise();
    },
    fetch() {
      const deferred = $.Deferred();
      const slug = assign({}, omit(this.blogSearch.attributes, ['blog', 'loggingData']));
      if (slug.post_type === 'ANY') {
        delete slug.post_type;
      }
      this.chromeTrigger('chrome:fetch:blogPosts', slug, response => {
        this.collateData(response.posts).then(posts => {
          let offset = this.blogSearch.get('next_offset');
          this.blogSearch.set('next_offset', offset += posts.length);
          deferred.resolve(posts);
        });
      });
      return deferred.promise();
    },
    collateData(posts) {
      const deferred = $.Deferred();
      if (typeof posts === 'undefined') {
        return deferred.reject(new Error('Error: posts are undefined'));
      }
      const promises = posts.map(post => {
        const slug = {
          tumblelog_name_or_id: post.blog_name,
          post_id: post.id,
          limit: 1,
          offset: 0
        };
        return this._request(slug);
      });
      $.when.apply($, promises).done((...posts) => {
        deferred.resolve([].concat(...posts));
      });
      return deferred.promise();
    },
    _request(data) {
      const deferred = $.Deferred();
      $.ajax({
        url: 'https://www.tumblr.com/svc/indash_blog/posts',
        beforeSend: xhr => {
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        data,
        success: data => {
          deferred.resolve({
            post: data.response.posts[0],
            tumblelog: data.response.tumblelog
          });
        },
        fail: error => {
          deferred.reject(error);
        }
      });
      return deferred.promise();
    },
    initialIndashSearch(posts) {
      const deferred = $.Deferred();
      Tumblr.Events.trigger('fox:autopaginator:start');
      posts = posts.filter(post => {
        return post.post_html;
      });
      return deferred.resolve(posts);
    }
  });

  Tumblr.Fox.register('BlogModel', BlogModel);
});
