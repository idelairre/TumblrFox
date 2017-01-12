import $ from 'jquery';
import { template, pick } from 'lodash';
import { View } from 'backbone';
import infoTemplate from './infoTemplate.html';

const InfoComponent = View.extend({
  name: 'info',
  startWithParent: true,
  className: 'sidebar_nav_item',
  tagName: 'li',
  template: '<a class="sidebar_link" id="tumblrFoxInfo">TumblrFox</a>',
  events: {
    'click #tumblrFoxInfo': 'showDialog'
  },
  initialize(options) {
    Object.assign(this, pick(options, ['options']));
    this.render();
  },
  render() {
    const sidebarFooterNav = $('#sidebar_footer_nav').find('ul li:last-child');
    if (sidebarFooterNav.length > 0) {
      this.$el.html(this.template);
      sidebarFooterNav.before(this.$el);
    }
  },
  showDialog() {
    Tumblr.Dialog.alert({
      templates: {
        content: template(infoTemplate)
      }
    });
  }
});

module.exports = InfoComponent;
