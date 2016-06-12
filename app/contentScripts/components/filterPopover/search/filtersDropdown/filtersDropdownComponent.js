module.exports = (function filterDropdown(Tumblr, Backbone, _) {
  const { assign, mapKeys, pick } = _;
  const { get, Utils } = Tumblr.Fox;
  const { ComponentFetcher, TemplateCache } = Utils;
  const { ClickHandler, SearchFilters, SearchFiltersPopover, TumblrView } = ComponentFetcher.getAll('ClickHandler', 'SearchFilters', 'SearchFiltersPopover', 'TumblrView');
  const { transition } = get('animation');

  // TODO: apply popover mixin to this class

  const FiltersDropDownComponent = TumblrView.extend({
    className: 'popover--blog-search blog-search-filters-popover',
    mixins: [].concat(SearchFiltersPopover.prototype.mixins),
    template: TemplateCache.get('filterTemplate'),
    events: {
      'change input.date-filter-input': 'contentChanged',
      'click [data-filter]': 'onFilterClick',
      'click .toggle': 'onToggleFilterClick',
      'click .option-radio': 'onCheckboxClick',
      'change [type=checkbox]': 'onCheckboxChange'
    },
    initialize(options) {
      const ignores = ['template', 'render', 'initialize', 'bindEvents', 'events'];
      mapKeys(SearchFilters.prototype, (val, key) => {
        if (typeof val === 'function' && !ignores.includes(key)) {
          this.__proto__[key] = val;
        }
      });
      assign(this, pick(options, ['searchOptions', 'state']));
      this.bindEvents();
    },
    render() {
      this.$el.html(this.template);
      this.$main = this.$('.popover_menu');
      this.$date = this.$('.date-filter');
      this.$toggleItems = this.$('.toggle_items');
      this.$date.find('input').val(new Date().toDateInputValue());
      if (this.searchOptions.get('tag') && !this.state.get('likes')) {
        this.$date.parents().find('.datepicker').hide();
        this.$(this.$el.find('.search_filter_items')[2]).css('border-bottom', '0px');
      }
      setTimeout(::this.setActiveAndBindEvents, 1);
      return this;
    },
    bindEvents() {
      SearchFilters.prototype.bindEvents.apply(this);
      this.listenTo(this.model, 'change:filter_nsfw', ::this.hide);
    },
    bindClickOutside() { // this no longer closes when you click on the filter icon
      const options = {
        preventInteraction: true,
        ignoreSelectors: ['.popover_content_wrapper', '.tumblelog_popover']
      };
      if (this._popoverBase.autoTeardown) {
        this.clickOutside = new ClickHandler(this.el, options);
        this.clickOutside.on('click:outside', this.hide, this);
      }
    },
    contentChanged(e) {
      this.model.set('before', Date.parse(e.currentTarget.value));
      console.log('[DATE]', this.model.get('before'));
    },
    toggleDate(e) {
      console.log(e);
    },
    hide() {
      this.unbindClickOutside();
      this.$main.removeClass('popover--active');
      transition(this.$el, ::this.afterHide);
    },
    afterHide() {
      this.teardown();
      this.remove();
    },
    unbindClickOutside() {
      if (this.clickOutside) {
        this.clickOutside.remove();
        this.clickOutside = null;
      }
    },
    setActiveAndBindEvents() {
      this.$main.addClass('popover--active');
      this.bindClickOutside();
    },
    show() {
      this.$el.css({ display: 'block' });
      setTimeout(::this.setActiveAndBindEvents, 1);
    }
  });

  Tumblr.Fox.register('FiltersDropDownComponent', FiltersDropDownComponent);
});
