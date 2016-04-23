module.exports = (function postFetcher() {
  const $ = Backbone.$;
  Tumblr.Fox = Tumblr.Fox || {};

  function stringify(parameters) {
    let params = [];
    for (let p in parameters) {
      params.push(encodeURIComponent(p) + '=' + encodeURIComponent(parameters[p]));
    }
    return params.join('&');
  };

  Tumblr.Fox.apiSlug = {
    type: null,
    offset: 0,
    limit: 8
  }

  Tumblr.Fox.fetchPosts = function(slug) {
    if (Tumblr.Fox.Loader.options.loading) return;

    const params = stringify({
      limit: (typeof slug.limit !== 'undefined' ? slug.limit : 12),
      type: slug.type,
      offset: (typeof slug.offset !== 'undefined' ? slug.offset : null),
      since_id: (typeof slug.sinceId !== 'undefined' ? slug.sinceId : null)
    });

    // console.log('[CHROME FETCH]', Tumblr.Fox.options, params);
    const req = new CustomEvent('chrome:fetch:posts', {
      detail: params
    });
    window.dispatchEvent(req);
  }

  Tumblr.Fox.fetchBlogPosts = function(slug) {
    if (Tumblr.Fox.Loader.options.loading) {
      return;
    }
  }

  Tumblr.Fox.fetchPostData = function(slug) {
    if (!Tumblr.Fox.AutoPaginator.options.apiFetch && Tumblr.Fox.Loader.options.loading) return;
    Tumblr.Events.trigger('fox:postFetch:started', slug);

    let request = $.ajax({
      url: 'https://www.tumblr.com/svc/indash_blog/posts',
      beforeSend: (xhr) => {
        xhr.setRequestHeader('x-tumblr-form-key', Tumblr.Fox.constants.formKey);
      },
      data: {
        tumblelog_name_or_id: slug.blogNameOrId || slug.blogname,
        post_id: slug.postId,
        limit: slug.limit || 10,
        offset: slug.offset || 0,
        post_type: slug.post_type
      }
    });

    request.success(data => {
      if (!Tumblr.Fox.AutoPaginator.options.apiFetch) {
        Object.assign(Tumblr.Fox.AutoPaginator.query.loggingData, slug);
        Tumblr.Fox.AutoPaginator.query.loggingData.offset += data.response.posts.length;
      }
      Tumblr.Events.trigger('fox:postFetch:finished', data.response);
    })

    request.fail(error => {
      Tumblr.Events.trigger('fox:postFetch:failed'),
      console.error(error);
    });
  }

  Tumblr.Fox.filterPosts = function(filterType) {
    if (filterType && filterType !== Tumblr.Fox.options.currentFilter) {
      Tumblr.Fox.apiSlug.type = filterType;
      Tumblr.Fox.apiSlug.offset = 0;
    }
    // Tumblr.Posts.invoke('dismiss'),
    $('li[data-pageable]').fadeOut(300, () => {
      $('.standalone-ad-container').remove(),
      $('li[data-pageable]').remove();
    });
  }

  Tumblr.Fox.handOffPosts = function(e) {
    const chromeResponse = e.detail;
    Tumblr.Fox.apiSlug.offset += chromeResponse.posts.length;
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
