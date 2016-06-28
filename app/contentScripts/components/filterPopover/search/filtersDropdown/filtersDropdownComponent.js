module.exports = (function filterDropdown(Tumblr, Backbone, _) {
  const { assign, isFunction, mapKeys, template, pick } = _;
  const { get, Utils } = Tumblr.Fox;
  const { ComponentFetcher, TemplateCache } = Utils;
  const { ClickHandler, SearchFilters, TumblrView } = ComponentFetcher.getAll('ClickHandler', 'SearchFilters', 'TumblrView');
  const { transition } = get('animation');

  const FiltersDropDownComponent = SearchFilters.extend({
    template: template(TemplateCache.get('filterTemplate')),
    events: {
      'change .date-filter-input': 'setDate',
      'click .toggle': 'onToggleFilterClick',
      'click .option-radio': 'onCheckboxClick',
      'click [data-filter]': 'onFilterClick',
      'change [type=checkbox]': 'onCheckboxChange'
    },
    initialize(options) {
      assign(this, pick(options, ['model', 'state']));
      this.bindEvents();
    },
    render() {
      this.$el.html(this.template(this));
      this.$date = this.$('.date-filter');
      this.$date.find('input').val(new Date().toDateInputValue());
      return this;
    },
    bindEvents() {
      SearchFilters.prototype.bindEvents.apply(this);
    },
    setDate(e) {
      this.model.set('before', Date.parse(e.currentTarget.value));
    },
    onFilterClick() {
      SearchFilters.prototype.onFilterClick.apply(this, arguments);
    }
  });

  Tumblr.Fox.register('FiltersDropDownComponent', FiltersDropDownComponent);
});
