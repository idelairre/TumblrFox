/* global window:true */
/* eslint no-undef: "error" */

module.exports = (function main(Tumblr, Backbone, _) {
  window.webpackJsonp(0, [function (module, exports, require) {
    Tumblr.Fox = Tumblr.Fox || {};
    Tumblr.Fox.require = require;
    Tumblr.Fox.getComponent = Tumblr.Fox.getComponent.bind(this, Array.prototype.slice.call(arguments));

    const $ = Backbone.$;
    const { assign } = _;
    const listItems = $('#posts').find('li');
    const attachNode = $(listItems[listItems.length - 1]);
    const formKey = $('#tumblr_form_key').attr('content');

    // cache components
    Tumblr.Fox.getComponent('PrimaComponent', '.uniqueId("component")');
    Tumblr.Fox.getComponent('animation', 'webkitAnimationEnd');
    Tumblr.Fox.getComponent('PopoverMixin', '_crossesView');
    Tumblr.Fox.getComponent('PopoverComponent', 'this._beforeRender'); // this is more like an expanded Backbone view than specifically a popover
    Tumblr.Fox.getComponent('ClickHandler', 'document.addEventListener("click",this._onClick,!0)}');
    Tumblr.Fox.getComponent('NavSearch', 'nav-search');
    Tumblr.Fox.getComponent('PeeprBlogSearch', 'peepr-blog-search');
    Tumblr.Fox.getComponent('SearchResultView', 'inbox-recipients');
    Tumblr.Fox.getComponent('EventBus', '_addEventHandlerByString');
    Tumblr.Fox.getComponent('ConversationsCollection', '/svc/conversations/participant_suggestions');
    Tumblr.Fox.getComponent('Loader', 'this.createBarLoader()');
    Tumblr.Fox.getComponent('InboxCompose', '"inbox-compose"');
    Tumblr.Fox.getComponent('BlogSearch', 'this.onTermSelect');
    Tumblr.Fox.getComponent('Mixin', 'this.mixins=');
    Tumblr.Fox.getComponent('TumblrModel', '.Model.extend({})');
    Tumblr.Fox.getComponent('TumblrView', 'uniqueId("view")');
    Tumblr.Fox.getComponent('AutoComplete', '/svc/search/blog_search_typeahead');
    Tumblr.Fox.getComponent('SearchFiltersTemplate', 'model.showOriginalPostsSwitch');
    Tumblr.Fox.getComponent('SearchFiltersPopover', 'blog-search-filters-popover'); // extend this to get the settings options
    Tumblr.Fox.getComponent('SearchFilters', '[data-filter]');
    // Tumblr.Fox.getComponent('ModelForTinyGreyButton', '_updateSubscriptionStatus');

    assign(Backbone.Model, Tumblr.Fox.get('TumblrModel'));
    // Object.assign(Backbone.View, Tumblr.Fox.get('TumblrView'));

    Tumblr.Fox.constants = {
      attachNode,
      formKey
    };

    if (Tumblr.Fox.options.logging) {
      Tumblr.Fox.Events.start();
    }

    window.require = Tumblr.Fox.require;
    window.getComponent = Tumblr.Fox.getComponent;
  }]);
});
