import { defer, omit } from 'lodash';
import { ComponentFetcher } from '../../../utils';
import PopoverComponent from '../../popover/popoverComponent';

const { TumblrView } = ComponentFetcher.getAll('TumblrView');

const FollowingSearch = TumblrView.extend({
  template: '<i class="icon_filter"></i>',
  id: 'filter',
  className: 'follower-filter',
  defaults: {
    popoverOptions: {
      header: 'Sort',
      name: 'sort',
      multipleSelection: false,
      listItems: [
        { icon: 'icon_post_text', name: 'Alphabetically', data: 'alphabetically', checked: false },
        { icon: 'icon_activity', name: 'Most recently updated', data: 'recentlyUpdated', checked: false },
        { icon: 'icon_followers', name: 'Order followed', data: 'orderFollowed', checked: true }
      ]
    }
  },
  events: {
    'click i': 'togglePopover'
  },
  initialize(options) {
    this.state = options.state;
    this.options = Object.assign({}, this.defaults, omit(options, 'state'));
  },
  render() {
    this.$el.html(this.template);
  },
  togglePopover(e) {
    e.preventDefault();
    if (!this.popover) {
      this.popover = new PopoverComponent({
        pinnedTarget: this.$el,
        pinnedSide: 'bottom',
        class: 'popover--follower-popover',
        selection: 'checkmark',
        items: this.options.popoverOptions,
        onSelect: state => {
          if (this.state.get(state)) {
            return;
          }
          Tumblr.Fox.Events.trigger('fox:following:state', state);
        }
      });
      this.popover.render();
      this.listenTo(this.popover, 'close', this.onPopoverClose);
    }
  },
  hidePopover() {
    this.popover && this.popover.hide();
  },
  onPopoverClose() {
    defer(() => {
      this.popover = null;
    });
  }
});

module.exports = FollowingSearch;
