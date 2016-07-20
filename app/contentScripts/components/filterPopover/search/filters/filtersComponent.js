import { pick } from 'lodash';
import { ComponentFetcher } from '../../../../utils';
import FiltersDropDownComponent from './filtersDropdownComponent';

const { PeeprBlogSearch, SearchFiltersPopover } = ComponentFetcher.getAll('PeeprBlogSearch', 'SearchFiltersPopover');

const Filters = PeeprBlogSearch.prototype.subviews.filters.constructor;

const FilterPopoverContainer = SearchFiltersPopover.extend({
  Subview: FiltersDropDownComponent
});

const FiltersIconComponent = Filters.extend({
  initialize(options) {
    Object.assign(this, pick(options, ['model', 'state']));
    Filters.prototype.initialize.apply(this, arguments);
  },
  showPopover() {
    if (!this.popover) {
      this.popover = new FilterPopoverContainer({
        pinnedTarget: this.$el,
        model: this.model,
        state: this.state,
        preventInteraction: true
      });
      this.popover.render();
      this.listenTo(this.popover, 'close', this.onPopoverClose);
    }
  },
  onPopoverClose() {
    Filters.prototype.onPopoverClose.apply(this, arguments);
  }
});

module.exports = FiltersIconComponent;
