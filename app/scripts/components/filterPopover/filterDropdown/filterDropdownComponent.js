module.exports = (function filterDropdown() {
  Tumblr.Fox = Tumblr.Fox || {};

  const $ = Backbone.$;
  const { mapKeys } = _;
  const { get } = Tumblr.Fox;
  const SearchFiltersPopover = get('SearchFiltersPopover');
  const SearchFilters = get('SearchFilters');
  const transition = get('animation').transition;
  const ClickHandler = get('ClickHandler');
  const PopoverComponent = get('PopoverComponent');
  const popover = get('PopoverMixin');

  const FilterComponent = PopoverComponent.extend({
    className: 'popover--blog-search blog-search-filters-popover',
    mixins: Object.assign([popover], SearchFiltersPopover.prototype.mixins),
    template: $('#filterTemplate').html(),
    events: {
      'change input.date-filter-input': 'contentChanged',
      'click [data-filter]': 'onFilterClick',
      'click .sort_filter.toggle': 'onToggleFilterClick',
      'click .option-radio': 'onCheckboxClick',
      'change [type=checkbox]': 'onCheckboxChange'
    },
    initialize() {
      mapKeys(SearchFilters.prototype, (val, key) => {
        if (typeof val === 'function' && key !== 'template' && key !== 'render' && key !== 'initialize' && key !== 'bindEvents' && key !== 'events') {
          this[key] = val;
        }
      });
      this.state = this.model.attributes.state;
      console.log(this.state);
      this.bindEvents();
    },
    render() {
      this.$el.html(this.template);
      this.$main = this.$('.popover_menu');
      this.$date = this.$('.date-filter');
      this.$toggleItems = this.$('.toggle_items');
      console.log(this.$toggleItems);
      if (this.state.likes) {
        this.$date.find('input').val(new Date().toDateInputValue()) && this.$toggleItems.hide();
      } else {
        this.$date.parents().find('.datepicker').hide();
      }
      setTimeout(::this.setActiveAndBindEvents, 1);
    },
    bindEvents() {
      SearchFilters.prototype.bindEvents.apply(this);
    },
    bindClickOutside() {
      this._popoverBase.autoTeardown && (this.clickOutside = new ClickHandler(this.el),
      this.clickOutside.on('click:outside', this.hide, this));
    },
    contentChanged(e) {
      this.model.set('before', Date.parse(e.currentTarget.value));
      console.log('[MODEL]', this.model.attributes);
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

  return Tumblr.Fox.Filters;
});
