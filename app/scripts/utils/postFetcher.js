module.exports = (function postFetcher() {
  const $ = Backbone.$;
  Tumblr.Fox = Tumblr.Fox || {};

  Tumblr.Fox.fetchPosts = function(slug) {
    if (Tumblr.Fox.Loader.options.loading) {
      return;
    }
    console.log('[CHROME FETCH]', Tumblr.Fox.options);
    const req = new CustomEvent('fetch:posts', {
      detail: slug
    });
    window.dispatchEvent(req);
  }

  Tumblr.Fox.fetchPostData = function(slug, callback) {
    Backbone.Events.trigger('fox:postFetch:started');
    console.log('[REQUEST SLUG]', slug);

    let request = $.ajax({
      url: 'https://www.tumblr.com/svc/indash_blog/posts',
      beforeSend: (xhrObj) => {
        xhrObj.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
      },
      data: {
        tumblelog_name_or_id: slug.blogNameOrId,
        post_id: slug.postId,
        limit: 10,
        offset: slug.offset || 0
      }
    });

    request.success(response => {
      if (!Tumblr.Fox.AutoPaginator.options.apiFetch) {
        Object.assign(Tumblr.Fox.AutoPaginator.query.loggingData, slug);
        Tumblr.Fox.AutoPaginator.query.loggingData.offset += slug.limit;
        console.log('[REQUEST SLUG]', Tumblr.Fox.AutoPaginator.query.loggingData);
      }
      console.log('[RESPONSE]', response.response.posts);
      return Backbone.Events.trigger('fox:postFetch:finished'),
      callback ? callback(response.response) : response.response;
    })

    request.fail(error => {
      Backbone.Events.trigger('fox:postFetch:failed'),
      console.error(error);
    });
  }

  Tumblr.Fox.filterPosts = function(filterType) {
    if (filterType && filterType !== Tumblr.Fox.options.currentFilter) {
      Tumblr.Fox.options.type = filterType;
      Tumblr.Fox.options.offset = 0;
    }
    // Tumblr.Posts.invoke('dismiss'),
    $('li[data-pageable]').fadeOut(300, () => {
      $('.standalone-ad-container').remove(),
      $('li[data-pageable]').remove();
    });
  }

  Tumblr.Fox.handOffPosts = function(e) {
    console.log('[CHROME RESPONSE HANDOFF]', e.detail);
    const chromeResponse = e.detail;
    Tumblr.Fox.options.offset += chromeResponse.posts.length;
    for (let i = 0; chromeResponse.posts.length > i; i += 1) {
      const post = chromeResponse.posts[i];
      Tumblr.Fox.fetchPostData({ blogNameOrId: post.blog_name, postId: post.id }, response => {
        const postData = response.posts[0];
        let { postContainer, postElement, postModel } = Tumblr.Fox.formatDashboardPost(postData);
        Tumblr.Fox.constants.attachNode.before(postContainer);
        Tumblr.Fox.createPostView(postElement, postModel);
      });
    }
  }

  return Tumblr.Fox;
});
