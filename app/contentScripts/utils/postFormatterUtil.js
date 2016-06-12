module.exports = (function postFormatter(Tumblr, Backbone, _) {
  const { $ } = Backbone;
  const { defaultsDeep, escape, extend, omit, unescape, union } = _;
  const { get } = Tumblr.Fox;

  const escapeQuotes = string => {
    return string.replace(/"/g, '\\"');
  }

  const unescapeQuotes = string => {
    return string.replace(/\\"/g, '"');
  }

  const PostFormatter = function () { };

  extend(PostFormatter.prototype, {
    formatType(postData) {
      if (postData.type === 'text') {
        return 'regular';
      } else if (postData.type === 'answer') {
        return 'note';
      } else if (postData.type === 'chat') {
        return 'conversation';
      } else {
        return postData.type;
      }
    },
    renderPostFromHtml(post) {
      if (typeof post.html !== 'undefined') {
        const PostView = get('PostViewComponent');
        const escapedHtml = unescapeQuotes(unescapeQuotes(post.html)); // NOTE: make it so you don't have to run this twice
        const postElement = $($.parseHTML(escapedHtml));
        const postModel = new Tumblr.Prima.Models.Post($(postElement).data('json'));
        postModel.set('html', escapedHtml);
        new PostView({
          model: postModel
        });
      }
    },
    renderPostsFromHtml(posts) {
      posts.map(this.renderPostFromHtml);
    },
    renderPosts(items) {
      if (!items) {
        throw new Error('Attempted to render empty array of posts');
      }
      items.map(item => { // NOTE: posts do not come out in order due to different formatting times
        const PostView = get('PostViewComponent');
        const { post, tumblelog } = item;
        postModel = this.marshalPostAttributes(post, tumblelog);
        new PostView({
          model: new Tumblr.Prima.Models.Post(postModel)
        });
      });
    },
    parseTags(post) {
      if (post.tags) {
        return;
      }
      const postHtml = $(post.$el);
      const tagElems = postHtml.find('.post_tags');
      if (tagElems.length > 0) {
        const rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#');
        const tags = rawTags.filter(tag => {
          if (tag !== '') {
            return tag;
          }
        });
        post.tags = tags;
      } else {
        post.tags = [];
      }
      post.model.set('tags', post.tags);
      return post;
    },
    // NOTE: this results in duplicates
    renderDashboardPosts(posts) {
      posts.map(post => {
        const PostView = get('PostViewComponent');
        const postData = post.model.toJSON();
        const postModel = new Tumblr.Prima.Models.Post(postData);
        Tumblr.postsView.postViews = [];
        new PostView({
          model: postModel
        });
        post.remove();
      });
    },

    /**
    * Tumblelog model
    * @namespace Tumblr.Prima.Models.Tumbelog
    * @property anonymous_asks: {Number}
    * @property asks: {Boolean}
    * @property avatar_url: {String}
    * @property can_receive_messages: {Boolean}
    * @property can_send_messages: {Boolean}
    * @property can_subscribe: {Boolean}
    * @property cname: {String}
    * @property customizable: {Boolean}
    * @property dashboard_url: {String} - Short url relative to dashboard, e.g., "/blog/theladymisandry"
    * @property description: {String}
    * @property description_sanitized: {String}
    * @property following: {Boolean}
    * @property is_group: {Boolean}
    * @property is_private: {Boolean}
    * @property is_subscribed: {Boolean}
    * @property likes: {Boolean}
    * @property name: {String}
    * @property premium_partner: {Boolean}
    * @property share_following: {Boolean}
    * @property title: {String}
    * @property url: {String}
    * @property uuid: {String} - Full Tumblr url, e.g., "http://themisandrylady.tumble.com"
    */

    /**
    * PostView viewModel
    * @namespace Tumblr.PostView
    * @property accepts-answers: {Boolean}
    * @property can_reply: {Boolean}
    * @property direct-video: {Boolean}
    * @property id: {Number}
    * @property is-animated: {Boolean}
    * @property is-pinned: {Boolean}
    * @property is-mine: {Boolean}
    * @property is_reblog: {Boolean}
    * @property is-recommended: {Boolean}
    * @property liked: {Boolean}
    * @property log-index: {String}
    * @property placement_id: {Number}
    * @property post-id: {Number}
    * @property premium-tracked: {Number}
    * @property pt: {String}
    * @property reblog-key: {String}
    * @property reblog_key: {String}
    * @property reblog_source: {String}
    * @property recommendation_reason: {String}
    * @property root_id: {String}
    * @property share_popover_data: {Object}
    * @property sponsered: {String}
    * @property tumblelog: {String}
    * @property tumblelog-data: {Object} recognzed parameters:
    *   "avatar": {Array} element parameters:
    *      "height": {Number}
    *       "url": {String}
    *       "width": {Number}
    *   "can_message": {Boolean}
    *   "description": {String}
    *   "key": {String}
    *   "name": {String}
    *   "share_following": {Boolean}
    *   "share_likes": {Boolean}
    *   "theme": {Object}
    *   "title": {String}
    *   "updated": {Number}
    *   "url": {String}
    *   "uuid": {String}
    * @property tumblelog-key: {String}
    * @property tumblelog-name: {String}
    * @property tumblelog-parent-data: {Object}
    * @property tumblelog-root-data: {Object}
    * @property type: {String}
    */

    marshalPostAttributes(postData, blogData) {
      postData = postData.post || postData;
      postData = omit(postData, ['body', 'format', 'highlighted', 'recommended_color', 'recommended_source', 'summary', 'state', 'trail']);
      blogData = blogData || {
        anonymous_asks: null,
        asks: null,
        avatar_url: postData.blog.avatar[1].url,
        can_receive_messages: null,
        can_send_in_message: null,
        can_subscribe: null,
        cname: '',
        customizable: false,
        dashboard_url: `blog/${postData.tumblelog}`,
        description_sanitized: postData.blog.description.trim(),
        following: null,
        is_group: null,
        is_subscribed: null,
        likes: postData.blog.share_likes,
        name: postData.blog.name,
        premium_partner: false,
        share_following: false,
        title: postData.blog.title,
        url: postData.blog.url,
        uuid: postData.blog.uuid
      };
      postData = defaultsDeep({
        'accepts-answers': null,
        can_reply: postData.can_reply,
        'direct-video': null,
        id: postData.id,
        'is-animated': null,
        'is-mine': null,
        is_reblog: typeof postData.reblogged_from_tumblr_url === 'string' ? true : false,
        'is-recommended': null,
        'is-tumblrfox-post': true,
        liked: postData.liked,
        'log-index': '2',
        name: postData.blog.name,
        'post-id': postData.id,
        show_reporting_links: false,
        tumblelog: postData.blog.name,
        'tumblelog-name': postData.blog.name,
        'tumblelog-key': postData.blog.key,
        'reblog-key': postData.reblog_key,
        reblog_key: postData.reblog_key,
        reblog_source: 'POST_CONTEXT_UNKOWN',
        root_id: postData.reblogged_root_id,
        type: this.formatType(postData),
        'tumblelog-data': blogData,
        'tumblelog-parent-data': typeof postData.reblogged_from_tumblr_url === 'string' ? {
          anonymous_asks: null,
          avatar_url: null,
          can_send_messages: postData.reblogged_from_can_message,
          can_receive_messages: null,
          cname: '',
          dashboard_url: `/blog/${postData.reblogged_from_name}`,
          following: postData.reblogged_from_following,
          is_group: null,
          is_private: null,
          is_subscribed: null,
          likes: null,
          name: postData.reblogged_from_name,
          premium_partner: false,
          share_following: null,
          title: postData.reblogged_from_title,
          url: postData.reblogged_from_tumblr_url,
          uuid: postData.reblogged_from_uuid
        } : false,
        'tumblelog-root-data': typeof postData.reblogged_from_tumblr_url === 'string' ?  {
          anonymous_asks: null,
          avatar_url: null,
          can_send_messages: postData.reblogged_root_can_message,
          cname: '',
          following: postData.reblogged_root_following,
          is_group: null,
          is_private: null,
          is_subscribed: null,
          likes: null,
          name: postData.reblogged_root_name,
          premium_partner: null,
          share_following: null,
          title: postData.reblogged_root_title,
          url: postData.reblogged_root_url,
          uuid: postData.reblogged_root_uuid
        } : false
      }, postData);
      postData = omit(postData, ['blog', 'reblog', 'reblogged_from_can_message', 'reblogged_from_following', 'reblogged_from_followed', 'reblogged_from_id', 'reblogged_from_name', 'reblogged_from_title', 'reblogged_from_tumblr_url', 'reblogged_from_url', 'reblogged_from_uuid', 'reblogged_root_can_message', 'reblogged_root_following', 'reblogged_root_name', 'reblogged_root_title', 'reblogged_root_url', 'reblogged_root_uuid']);
      return postData;
    }
  });

  Tumblr.Fox.Utils.PostFormatter = new PostFormatter();
});
