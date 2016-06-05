module.exports = (function filterDropdown(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { mapKeys } = _;
  const { get } = Tumblr.Fox;
  const SearchFiltersPopover = get('SearchFiltersPopover');
  const SearchFilters = get('SearchFilters');
  const transition = get('animation').transition;
  const ClickHandler = get('ClickHandler');
  const PopoverComponent = get('PopoverComponent');
  const popover = get('PopoverMixin');

  // TODO: apply popover mixin to this class

  const FilterComponent = PopoverComponent.extend({
    className: 'popover--blog-search blog-search-filters-popover',
    mixins: [].concat(SearchFiltersPopover.prototype.mixins),
    template: $('#filterTemplate').html(),
    events: {
      'change input.date-filter-input': 'contentChanged',
      'click [data-filter]': 'onFilterClick',
      'click .toggle': 'onToggleFilterClick',
      'click .option-radio': 'onCheckboxClick',
      'change [type=checkbox]': 'onCheckboxChange'
    },
    initialize() {
      mapKeys(SearchFilters.prototype, (val, key) => {
        if (typeof val === 'function' && key !== 'template' && key !== 'render' && key !== 'initialize' && key !== 'bindEvents' && key !== 'events') {
          this.__proto__[key] = val;
        }
      });
      this.state = Tumblr.Fox.state;
      this.searchOptions = Tumblr.Fox.searchOptions;
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
    bindClickOutside() {
      this.clickOutside = new ClickHandler(this.el);
      this.clickOutside.on('click:outside', this.hide, this);
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
      this.clickOutside && (this.clickOutside.remove(), this.clickOutside = null);
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

  Tumblr.Fox.Filters = FilterComponent;
});
