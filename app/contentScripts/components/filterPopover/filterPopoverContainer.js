import $ from 'jquery';
import ComponentFetcher from '../../utils/componentFetcherUtil';
import FilterPopoverComponent from './filterPopoverComponent';

const PrimaComponent = ComponentFetcher.get('PrimaComponent');

const FilterPopoverContainer = PrimaComponent.extend({
  name: 'FilterPopover',
  initialize(options) {
    this.options = Object.assign({}, options);
  },
  view(e) {
    Object.assign(e, {
      pinnedTarget: $('#filter'),
      isFixedPosition: true,
      autoTeardown: false, // NOTE: do not touch these
      teardownOnEscape: false
    });
    return new FilterPopoverComponent(e);
  },
  show() {
    this.view.show();
  },
  render() {
    this.view.render();
    this.trigger('append');
    return this;
  }
});

module.exports = FilterPopoverContainer;
