module.exports = (function postFormatter(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { escape, unescape } = _;

  const escapeQuotes = string => {
    return string.replace(/"/g, '\\"');
  }

  const unescapeQuotes = string => {
    return string.replace(/\\"/g, '"');
  }

  const formatType = postData => {
    if (postData.type === 'text') {
      return 'regular';
    } else if (postData.type === 'answer') {
      return 'note';
    } else if (postData.type === 'chat') {
      return 'conversation';
    } else {
      return postData.type;
    }
  }

  const formatFooter = postDiv => {
    const postFooter = postDiv.find('.post_footer');
    postFooter.addClass('clearfix').attr('data-subview', 'footer').find('.post_notes').attr('data-subview', 'notes').find('.post_notes').wrapInner('<div class="post_notes_inner"></div>');
    const postControls = postFooter.find('.post_controls');
    postControls.attr('role', 'toolbar').attr('data-subview', 'controls').wrapInner('<div class="post_controls_inner"></div>');
    postFooter.find('.note_link_current').replaceWith(function () {
      const notes = $(this);
      if (notes.data('count') !== 0) {
        return $(`<span class="note_link_current" title="${notes.attr('title')}" data-less="${notes.attr('data-less')}" data-count="${notes.attr('data-count')}" data-more="${notes.attr('data-more')}">${notes.text()}</span>`);
      } else {
        return $(`<span class="note_link_current" title="${notes.attr('title')}" data-less="${notes.attr('data-less')}" data-count="${notes.attr('data-count')}" data-more="${notes.attr('data-more')}"></span>`);
      }
    });
    const postReply = postControls.find('.reply');
    postControls.find('.reply_container').replaceWith(postReply);
  }

  const formatPostHeader = (postData, postView, postDiv) => {
    const postHeader = $(postView.$el).find('.post_header');
    postHeader.attr('class', 'post_header').wrapInner('<div class="post_info"><div class="post_info_fence"></div></div>');
    const postInfoLink = `<a class="post_info_link" href="http://${postData['tumblelog-data'].uuid}" data-tumblog-popover="${escape(JSON.stringify(postData['tumblelog-data']))}">${postData.tumblelog}</a>`;
    const reblogFollowButton = postHeader.find('.reblog_follow_button').detach();
    postHeader.find('.post_info_fence').prepend(postInfoLink);
    if (postHeader.find('.reblog_info').length) {
      postHeader.find('.reblog_info').wrap('<span class="reblog_source"></span>');
      if (postInfoLink) {
        postHeader.find('.post_info_fence').addClass('has_follow_button').after(reblogFollowButton);
      }
    } else {
      postDiv.find('.post_info').append(reblogFollowButton);
    }
  }

  const createAvatar = postData => {
    const avatar =  `
      <div class="post_avatar  show_user_menu">
        <div class="post_avatar_wrapper">
          <a class="post_avatar_link"
            href="${postData['tumblelog-data'].url}"
            target="_blank"
            title="${postData['tumblelog-data'].title}"
            id="post_avatar${postData.id}"
            style="background-image:url('${postData['tumblelog-data'].avatar_url}')"
            data-user-avatar-url="${postData['tumblelog-data'].avatar_url}"
            data-avatar-url="${postData['tumblelog-data'].avatar_url}"
            data-blog-url="${postData['tumblelog-data'].url}"
            data-tumblelog-name="${postData.tumblelog}"
            data-use-channel-avatar="1"
            data-use-sub-avatar=""></a>
        </div>
      </div>`;
      return avatar;
  }

  const createPostWrapper = postData => {
    // NOTE: pt is probably premium_tracked, don't need to set that
    const wrapper = `
      <div id="post_${postData.id}" class="post post_full with_permalink pt reblog_ui_refresh is_${postData.type}
        ${Tumblr.Prima.currentUser().attributes.name === postData.tumblelog ? 'is_mine' : 'not_mine'}
        ${postData['tumblelog-parent-data'] ? 'is_reblog' : 'is_original'}
        ${postData.source_title ? 'has_source' : 'no_source'}
        ${postData.post_html.includes('View On') ? 'app_source' : 'generic_source'}
        ${postData.notes.count === 0 ? 'no_notes' : ''}"
        ${postData.can_reply ? 'data-can_reply="1"' : ''}
        data-id="${postData.id}"
        data-type="${postData.type}"
        data-reblog_source="${postData.reblog_source}"
        data-reblog_key="${postData.reblog_key}"
        data-reblog-key="${postData.reblog_key}"
        data-root_id="${postData.root_id}"
        data-tumblelog="${postData.tumblelog}"
        data-is-reblog="${postData['tumblelog-parent-data'] ? 1 : 0}"
        data-tumblog-key="${postData['tumblelog-data'].key}">`;
      return wrapper;
  }

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

  const marshalPostAttributes = (postData) => {
    postData.type = formatType(postData);
    postData.blog.avatar_url = postData.blog.avatar[1].url
    delete postData.blog.avatar;
    postData.share_popover_data.show_reporting_link = false;
    postData.tumblelog = postData.blog.name;
    postData['tumblelog-name'] = postData.blog.name;
    postData['reblog-key'] = postData.reblog_key;
    postData.reblog_source = 'POST_CONTEXT_UNKOWN';
    postData['log-index'] = '2';
    postData.renameProperty('blog', 'tumblelog-data');
    postData.premium_partner = false;
    postData['tumblelog-data'].renameProperty('share_likes', 'likes');
    postData['tumblelog-data'].renameProperty('tumblelog_uuid', 'uuid');
    postData['tumblelog-data'].can_receive_messages = postData['tumblelog-data'].can_send_in_message;
    postData['tumblelog-data'].dashboard_url = `blog/${postData.tumblelog}`;
    postData['tumblelog-data'].description_sanitized = escape(postData.description);
    postData['tumblelog-data'].following = postData.followed;
    postData['tumblelog-data'].customizable = false;

    if (postData.hasOwnProperty('reblogged_from_name')) {
      postData['tumblelog-parent-data'] = {
        anonymous_asks: null,
        cname: '',
        avatar_url: null,
        can_send_messages: postData.reblogged_from_can_message,
        can_receive_messages: null,
        dashboard_url: `/blog/${postData.reblogged_from_name}`,
        following: postData.reblogged_from_following,
        is_group: null,
        is_private: null,
        is_subscribed: null,
        likes: null,
        name: postData.reblogged_from_name,
        premium_partner: null,
        share_following: null,
        title: postData.reblogged_from_title,
        url: postData.reblogged_from_tumblr_url,
        uuid: postData.reblogged_from_uuid
      }
    }

    if (postData.hasOwnProperty('reblogged_root_name')) {
      postData['tumblelog-root-data'] = {
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
      };
    }

    for (const key in postData) {
      if ({}.hasOwnProperty.call(postData, key)) {
        if (key.includes('reblogged')) {
          delete postData[key];
        }
      }
    }
    return postData;
  }

  const PostFormatter = {
    formatDashboardPost(postData) {
      const postModel = new Tumblr.Prima.Models.Post(postData);
      const postView = new Tumblr.IndashBlog.PostView({
        model: postModel
      });
      postView.render();

      postModel.attributes = marshalPostAttributes(postModel.attributes);
      postModel.set(postModel.attributes);
      postModel.initialize(postModel.attributes);

      const postAvatar = createAvatar(postModel.attributes);
      const postWrapper = createPostWrapper(postModel.attributes);

      const postDiv = $(postView.$el).find('.post_chrome');
      postDiv.attr('class', 'post_wrapper').removeAttr('data-post-id').find('.post_content').wrapInner('<div class="post_content_inner clearfix"></div>').addClass('clearfix');

      if (postData.type === 'note') {
        const askButton = `<a class="post_tag ask post_ask_me_link" href="http://${postData.tumblelog}.tumblr.com/ask" data-tumblelog-name="${postData.tumblelog}">Ask ${postData.tumblelog} a question</a>`;
        if (!postDiv.find('.post_tags_inner').length && postDiv.find('.note_wrapper').length < 2) {
          postDiv.find('.post_content').after(`<div class="post_tags"><div class="post_tags_inner">${askButton}</div></div>`);
        } else {
          postDiv.find('.post_tags_inner').prepend(askButton);
        }
      }

      formatPostHeader(postModel.attributes, postView, postDiv);
      formatFooter(postDiv);

      const postElement = $(`${postWrapper}${postAvatar}${postView.$el.html()}</div>`).attr('data-json', JSON.stringify(postData));
      const postContainer = $(`<li class="post_container" data-pageable="post_${postModel.id}"></li>`).append(postElement);
      postView.remove();
      return { postContainer, postElement, postModel };
    },
    renderPostFromHtml(post) {
      if (typeof $.parseHTML(post.html) !== 'undefined') {
        const escapedHtml = unescapeQuotes(unescapeQuotes(post.html)); // NOTE: make it so you don't have to run this twice
        const postElement = $($.parseHTML(escapedHtml));
        const postModel = new Tumblr.Prima.Models.Post($(postElement).data('json'));
        const postContainer = $(`<li class="post_container" data-pageable="post_${postModel.get('id')}"></li>`).append(postElement);
        Tumblr.Fox.constants.attachNode.before(postContainer);
        Tumblr.Fox.Utils.PostFormatter.createPostView(postElement, postModel);
        Tumblr.Posts.add(postModel);
      }
    },
    createPostView(postElement, postModel) {
      const postView = new Tumblr.PostView({
        el: postElement,
        model: postModel
      });
      // console.log('[POSTVIEW]: ', postView); // needs a model for follow button which relies on a tumblelog model attribute
      postElement.attr('data-likeable-view-exists', true);
      if (postView.$el.find('.reblog-list').length) {
        postView.$reblog_list = postView.$el.find('.reblog-list');
      }
      Tumblr.postsView.postViews.push(postView);
      Tumblr.Events.trigger('postsView:createPost', postView);
      Tumblr.Events.trigger('DOMEventor:updateRect');
    },
    renderPosts(response) {
      if (!response) {
        return;
      }
      const posts = response.posts || response;
      for (let i = 0; posts.length > i; i += 1) { // NOTE: posts do not come out in order due to different formatting times
        Tumblr.Fox.Utils.PostFormatter.renderPost(posts[i]);
      }
    },
    renderPost(post) {
      const { postContainer, postElement, postModel } = Tumblr.Fox.Utils.PostFormatter.formatDashboardPost(post);
      Tumblr.Fox.constants.attachNode.before(postContainer);
      Tumblr.Fox.Utils.PostFormatter.createPostView(postElement, postModel);
      Tumblr.Posts.add(postModel);
    },
    parseTags(postViews) {
      return postViews.map(post => {
        const tagElems = post.$el.find('.post_tags');
        if (tagElems.length > 0) {
          const rawTags = tagElems.find('a.post_tag').not('.ask').text().split('#');
          post.tags = rawTags.filter(tag => {
            if (tag !== '') {
              return tag;
            }
          });
        } else {
          post.tags = [];
        }
      });
    },
  }

  Tumblr.Fox.Utils.PostFormatter = PostFormatter;
});
