import { $ } from 'backbone';
import { ComponentFetcher } from '../../utils';
import FilterPopoverComponent from './filterPopoverComponent';

const PrimaComponent = ComponentFetcher.get('PrimaComponent');

const FilterPopoverContainer = PrimaComponent.extend({
  name: 'FilterPopover',
  initialize(e) {
    this.options = Object.assign({}, e);
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
