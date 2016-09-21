import { $ } from 'backbone';
import { clone, defer, pick } from 'lodash';
import { ComponentFetcher } from '../../../../utils';
import PopoverComponent from '../../../popover/popoverComponent';

const TumblrView = ComponentFetcher.get('TumblrView');

const settingsPopoverTemplate = `
    <i class="icon_search toggle-search nav_icon"></i>`

const SettingsComponent = TumblrView.extend({
  className: 'search-settings',
  defaults: {
    popoverOptions: {
      multipleSelection: false,
      name: 'searchTarget',
      listItems: [
        { icon: 'none', name: 'Search likes', data: 'likes', checked: false},
        { icon: 'none', name: 'Search user', data: 'user', checked: true },
        { icon: 'none', name: 'Search dashboard', data: 'dashboard', checked: false }
      ]
    }
  },
  template: settingsPopoverTemplate,
  initialize(options) {
    this.intialized = false;
    Object.assign(this, this.defaults, pick(options, 'state'));
    this.listenTo(this.state, 'change:state', ::this.setSearchStateMenu);
    this.setSearchStateMenu(this.state.getState());
    return this;
  },
  setSearchStateMenu(state) {
    this.popoverOptions.listItems.map(li => {
      li.checked = (li.data === state ? true : false);
    });
    if (state === 'likes') {
      this.popoverOptions.listItems[1].name = 'Search likes by user';
      this.popoverOptions.listItems[2].hidden = true;
    } else if (state === 'user' && window.location.href === `https://www.tumblr.com/blog/${Tumblr.Prima.currentUser().id}`) {
      // don't show the settings icon
      this.popoverOptions.listItems[2].hidden = true;
    } else if (state !== 'likes' && window.location.href === 'https://www.tumblr.com/dashboard') {
      this.popoverOptions.listItems[0].hidden = true;
    }
  },
  render() {
    this.$el.html(this.template);
    this.initialized = true;
  },
  events: {
    'click .toggle-search': 'togglePopover'
  },
  togglePopover() {
    this.popover = new PopoverComponent({
      pinnedTarget: this.$el,
      pinnedSide: 'bottom',
      class: 'popover--settings-popover',
      selection: 'checkmark',
      items: this.popoverOptions,
      onSelect: ::this.onSelect
    });
    this.popover.render();
    this.listenTo(this.popover, 'close', this.onPopoverClose);
  },
  hidePopover() {
    this.popover && this.popover.hide();
  },
  onPopoverClose() {
    defer(() => {
      this.popover = null;
    });
  },
  onSelect(setting) {
    if (this.initialized && !this.state.get(setting)) {
      this.state.setState(setting);
    }
  }
});

module.exports = SettingsComponent;
