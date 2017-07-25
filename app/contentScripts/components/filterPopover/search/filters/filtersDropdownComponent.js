import { template, pick } from 'lodash';
import Events from '../../../../application/events';
import ComponentFetcher from '../../../../utils/componentFetcherUtil';
import filtersDropdownTemplate from './filtersDropdownTemplate.html';

const { animation, SearchFilters } = ComponentFetcher.getAll('animation', 'SearchFilters');
const { transition } = animation;

const FiltersDropDownComponent = SearchFilters.extend({
  template: template(filtersDropdownTemplate),
  events: {
    'change .date-filter-input': 'setDate',
    'click .toggle': 'onToggleFilterClick',
    'click .option-radio': 'onCheckboxClick',
    'click [data-filter]': 'onFilterClick',
    'change [type=checkbox]': 'onCheckboxChange'
  },
  initialize(options) {
    Object.assign(this, pick(options, ['model', 'state']));
    this.bindEvents();
  },
  render() {
    this.$el.html(this.template(this));
    this.$date = this.$('.date-filter').find('input');
    if (!this.model.get('before')) {
      this.$date.val(new Date().toDateInputValue());
    } else {
      this.$date.val(new Date(this.model.get('before') * 1000).toDateInputValue());
    }
    return this;
  },
  bindEvents() {
    SearchFilters.prototype.bindEvents.apply(this);
  },
  setDate(e) {
    this.model.set('before', Date.parse(e.currentTarget.value) / 1000);
  },
  onCheckboxClick() {
    SearchFilters.prototype.onCheckboxClick.apply(this, arguments);
    Events.trigger('fox:search:start');
  }
});

module.exports = FiltersDropDownComponent;
