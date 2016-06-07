module.exports = (function blogModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { assign, trim } = _;
  const { get, Posts, Utils } = Tumblr.Fox;

  const BlogModel = Model.extend({
    initialize(e) {
      this.blogSearch = e.blogSearch;
      this.attributes = {};
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(Tumblr.Events, 'indashblog:search:post-added', Utils.PostFormatter.renderPost);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.unbindEvents);
    },
    unbindEvents() {
      this.stopListening();
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.bindEvents);
    },
    fetch() {
      const deferred = $.Deferred();
      return deferred.resolve(this.blogSearch.fetch());
    },
    indashFetch(slug) {
      const deferred = $.Deferred();
      $.ajax({
        type: 'GET',
        url: 'https://www.tumblr.com/svc/indash_blog/posts',
        beforeSend: xhr => {
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        data: this.blogSearch.attributes,
        success: data => {
          deferred.resolve(data.response.posts);
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

  Tumblr.Fox.Blog = BlogModel
});

// {
//   tumblelog_name_or_id: slug.blogNameOrId || slug.blogname,
//   post_id: slug.postId,
//   limit: slug.limit || 8,
//   offset: slug.offset || 0
// }
