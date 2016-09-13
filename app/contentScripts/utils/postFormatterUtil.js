import $ from 'jquery';
import { defaultsDeep, extend, omit } from 'lodash';
import AppState from '../application/state';
import Events from '../application/events';
import PostView from '../components/postView/postViewComponent';
import ComponentFetcher from './componentFetcherUtil';

const unescapeQuotes = string => {
  return string.replace(/\\"/g, '"');
};

const stripScripts = s => {
 var div = document.createElement('div');
 div.innerHTML = s;
 var scripts = div.getElementsByTagName('script');
 var i = scripts.length;
 while (i--) {
   scripts[i].parentNode.removeChild(scripts[i]);
 }
 return div.innerHTML;
}

const PostFormatter = function () {
  if (!window.location.href.includes('search') && Backbone.history.location.host === 'www.tumblr.com') {
    this.avatarManager = ComponentFetcher.get('AvatarManager')();
    this.initializedAvatars = false;
    Events.on('fox:filteredPosts', () => {
      this.initializedAvatars = false;
    });
  }
};

extend(PostFormatter.prototype, {
  formatDashboardPosts(postData) {
    let posts = $(postData.trim());
    posts = Array.from(posts.find('[data-json]:not(.image-ad, .video-ad)'));
    posts = posts.map(post => {
      const postEl = $(post);
      post = postEl.data('json');
      post.html = postEl.parent().html();
      return post;
    });
    return posts;
  },
  formatType(postData) {
    if (postData.type === 'text') {
      return 'regular';
    } else if (postData.type === 'answer') {
      return 'note';
    } else if (postData.type === 'chat') {
      return 'conversation';
    }
    return postData.type;
  },
  renderPostFromHtml(post) {
    if (typeof post.html !== 'undefined') {
      if (Tumblr.postsView.collection.get(post.id)) {
        return;
      }
      const escapedHtml = unescapeQuotes(unescapeQuotes(post.html)); // NOTE: make it so you don't have to run this twice
      const postElement = $($.parseHTML(`<li class="post_container" data-pageable="post_${post.id}">${escapedHtml}</li>`));
      const postModel = new Tumblr.Prima.Models.Post(postElement.find('.post').data('json'));
      postElement.find('.post').attr('data-tumblrfox-post', true);
      Tumblr.Fox.constants.attachNode.before(postElement);
      const postView = new PostView({
        model: postModel,
        el: $(`[data-id="${post.id}"]`)
      });
      Tumblr.Events.trigger('postsView:createPost', postView);
    }
  },
  renderPost(postData, marshalAttributes) {
    if (marshalAttributes) {
      const postModel = this.marshalPostAttributes(postData);
      new PostView({
        model: new Tumblr.Prima.Models.Post(postModel)
      });
    } else {
      new PostView({
        model: new Tumblr.Prima.Models.Post(postData)
      });
    }
  },
  renderPosts(posts) {
    posts.map(post => { // NOTE: posts do not come out in order due to different formatting times
      if (Tumblr.postsView.collection.get(post.id)) {
        return;
      }
      if (typeof post.html !== 'undefined') {
        return this.renderPostFromHtml(post);
      }
      if (post.hasOwnProperty('tumblelog-data')) {
        return this.renderPost(post);
      }
      this.renderPost(post, true); // second argument signals to marshal the post
    });
    Tumblr.Events.trigger('DOMEventor:updateRect');
    if (!this.initializedAvatars) {
      this.avatarManager.initialize();
      this.initializedAvatars = true;
    }
  },
  parseTags(post) {
    const postHtml = $(post.$el);
    const tagElems = postHtml.find('.post_tags');
    if (tagElems && tagElems.length > 0) {
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
    if (AppState.get('dashboard')) {
      Events.trigger('fox:updateTags', post.model.get('tags'));
    }
    return post;
  },
  renderDashboardPosts(posts) {
    posts.map(post => {
      const postData = post.model.toJSON();
      const postModel = new Tumblr.Prima.Models.Post(postData);
      Tumblr.postsView.postViews = [];
      new PostView({
        model: postModel
      });
      post.remove();
    });
    Tumblr.Events.trigger('DOMEventor:updateRect');
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

  marshalPostAttributes(postData) {
    postData = omit(postData, ['body', 'format', 'highlighted', 'recommended_color', 'recommended_source', 'summary', 'state', 'trail']);
    const blogData = Tumblr.Prima.Models.Tumblelog.collection.findWhere({ name: postData.tumblelog }) ? Tumblr.Prima.Models.collection.findWhere({ name: postData.tumblelog }).toJSON() : defaultsDeep({
      avatar_url: postData.blog.avatar[1].url,
      name: postData.tumblelog,
      url: `http://${postData.tumblelog_uuid}`,
      uuid: postData.tumblelog_uuid
    });
    postData = defaultsDeep({
      'can_reply': postData.can_reply,
      'id': postData.id,
      'is_mine': postData.blog.name === Tumblr.Prima.currentUser().name,
      'is_reblog': typeof postData.reblogged_from_tumblr_url === 'string',
      'is-recommended': false,
      'is-tumblrfox-post': true,
      'liked': postData.liked,
      'log-index': '2',
      'name': postData.blog.name,
      'post-id': postData.id,
      'show_reporting_links': false,
      'tumblelog': postData.blog.name,
      'tumblelog-name': postData.blog.name,
      'tumblelog-key': postData.blog.key,
      'reblog-key': postData.reblog_key,
      'reblog_key': postData.reblog_key,
      'reblog_source': 'POST_CONTEXT_UNKOWN',
      'root_id': postData.reblogged_root_id,
      'tags': postData.tags,
      'type': this.formatType(postData),
      'tumblelog-data': blogData
    }, postData);
    if (postData.type === 'video') {
      postData['direct-video'] = 1;
    }
    if (postData.type === 'photo' && postData.post_html.includes('.gif')) {
      postData['is-animated'] = 1;
    }
    if (typeof postData.reblogged_from_name !== 'undefined') {
      const parentData = Tumblr.Prima.Models.collection.findWhere({ name: postData.reblogged_from_name }) || defaultsDeep({
        name: postData.reblogged_from_name,
        following: postData.reblogged_from_following,
        url: `http://${postData.reblogged_from_name}.tumblr.com`
      });
      postData['tumblelog-parent-data'] = (typeof parentData !== 'undefined' ? typeof parentData.toJSON === 'function' ? parentData.toJSON() : parentData : false);
    }
    if (typeof postData.reblogged_root_name !== 'undefined') {
      const rootData = Tumblr.Prima.Models.collection.findWhere({ name: postData.reblogged_root_name }) || defaultsDeep({
        name: postData.reblogged_root_name,
        following: postData.reblogged_root_following,
        url:  `http://${postData.reblogged_root_name}.tumblr.com`
      });
      postData['tumblelog-root-data'] = (typeof rootData !== 'undefined' ? typeof rootData.toJSON === 'function' ? rootData.toJSON() : rootData : false);
    }
    postData = omit(postData, ['blog', 'reblog', 'reblogged_from_can_message', 'reblogged_from_following', 'reblogged_from_followed', 'reblogged_from_id', 'reblogged_from_name', 'reblogged_from_title', 'reblogged_from_tumblr_url', 'reblogged_from_url', 'reblogged_from_uuid', 'reblogged_root_can_message', 'reblogged_root_following', 'reblogged_root_name', 'reblogged_root_title', 'reblogged_root_url', 'reblogged_root_uuid']);
    return postData;
  }
});

module.exports = new PostFormatter();
