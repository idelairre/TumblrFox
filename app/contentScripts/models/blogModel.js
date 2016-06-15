module.exports = (function blogModel(Tumblr, Backbone, _) {
  const { $, Model } = Backbone;
  const { isEmpty } = _;
  const { get } = Tumblr.Fox;
  const ChromeMixin = get('ChromeMixin');

  const BlogModel = Model.extend({
    mixins: [ChromeMixin],
    initialize(options) {
      this.blogSearch = options.blogSearch;
      this.attributes = this.blogSearch.attributes;
      this.set(this.attributes);
      this.bindEvents();
    },
    bindEvents() {
      this.listenTo(this.blogSearch, 'sync', model => {
        Tumblr.Events.trigger('fox:blogSearch:update', model.posts.toJSON());
      });
      this.listenTo(this.blogSearch.posts, 'reset', collection => {
        if (!isEmpty(collection.toJSON())) {
          Tumblr.Events.trigger('fox:blogSearch:started', collection.toJSON());
        }
      });
      this.listenTo(this.blogSearch, 'change', model => {
        this.set(this.blogSearch.attributes);
        this.trigger('change', model);
      });
      this.listenTo(this, 'change', () => {
        this.blogSearch.attributes = this.attributes;
      });
      this.listenTo(Tumblr.Events, 'fox:setFilter', ::this.setFilter);
      this.listenTo(Tumblr.Events, 'peepr-open-request', ::this.unbindEvents);
    },
    unbindEvents() {
      this.stopListening();
      this.listenTo(Tumblr.Events, 'peepr:close', ::this.bindEvents);
    },
    setFilter(type) {
      this.blogSearch.set('post_type', type);
    },
    search() { // NOTE: this fetch used to be wrapped in a promise but it had funky behavior
      this.blogSearch.fetch();
    },
    _fetch(query) {
      const deferred = $.Deferred();
      const slug = {
        tumblelog_name_or_id: query.blogname,
        limit: query.limit,
        offset: query.next_offset
      };
      this._request(slug).then(posts => {
        deferred.resolve(posts);
      });
      return deferred.promise();
    },
    fetch(query) {
      console.log('[QUERY]', query);
      if (query.post_type === 'ANY') {
        return this._fetch(query);
      }
      const deferred = $.Deferred();
      this.chromeTrigger('chrome:fetch:blogPosts', query, response => {
        this.collateData(response).then(posts => {
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
      console.log(data);
      const deferred = $.Deferred();
      $.ajax({
        url: 'https://www.tumblr.com/svc/indash_blog/posts',
        beforeSend: xhr => {
          xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
        },
        data,
        success: data => {
          Tumblr.Prima.Models.Tumblelog.collection.add(data.response.tumblelog);
          deferred.resolve(data.response.posts); // this needs to return a full array
        },
        fail: error => {
          deferred.reject(error);
        }
      });
      return deferred.promise();
    }
  });

  Tumblr.Fox.register('BlogModel', BlogModel);
});
