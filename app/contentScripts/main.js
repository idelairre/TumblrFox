module.exports = (function main(Tumblr, Backbone, _) {
  const { ComponentFetcher } = Tumblr.Fox.Utils;
  const { extend } = _;

  ComponentFetcher.getComponents({
    AutoComplete: '/svc/search/blog_search_typeahead',
    animation: 'webkitAnimationEnd',
    BlogSearch: 'this.onTermSelect',
    BlogSearchAutocompleteHelper: 'this.model.hasMatches()',
    BlogSearchPopover: 'popover--blog-search',
    ConversationsCollection: '/svc/conversations/participant_suggestions',
    ClickHandler: 'document.addEventListener("click",this._onClick,!0)}',
    EventBus: '_addEventHandlerByString',
    InboxCompose: '"inbox-compose"',
    PrimaComponent: '.uniqueId("component")',
    PopoverMixin: '_crossesView',
    NavSearch: 'nav-search',
    PeeprBlogSearch: 'peepr-blog-search',
    SearchResultView: 'inbox-recipients',
    KeyCommandsMixin: '__keyFn',
    Loader: 'this.createBarLoader()',
    Mixin: 'this.mixins=',
    SearchFilters: '[data-filter]',
    SearchFiltersPopover: 'blog-search-filters-popover',
    SearchInput: '$$(".blog-search-input")',
    TagsPopover: 'click [data-term]',
    TumblrModel: '.Model.extend({})',
    TumblrView: 'this._beforeRender'
  });

  extend(Backbone.Model, ComponentFetcher.get('TumblrModel'));

  Tumblr.Fox.trigger('fox:components:ready');
});
