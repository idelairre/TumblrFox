import Backbone from 'backbone';
import template from 'lodash.template';
import View from '../view/view';
import debugTemplate from './debug.html';

const Debug = View.extend({
  defaults: {
    props: {
      debug: false
    }
  },
  template: template(debugTemplate),
  className: 'debug--options',
  tagName: 'section',
  render() {
    this.listenTo(Backbone.Events, 'all', ::this.log);
    this.$el.html(this.template);
    this.$collapseButton = this.$el.find('#collapseButton');
    this.$debug = this.$el.find('#debugConsole');
  },
  events: {
    'click #collapseButton': 'collapse'
  },
  collapse() {
    if (!this.collapsed) {
      this.collapsed = true;
      this.$collapseButton.text('+');
      this.$el.find('.debug').css('height', '45px');
    } else {
      this.collapsed = false;
      this.$collapseButton.text('-');
      this.$el.find('.debug').css('height', '100px');
    }
  },
  log() {
    console.log('%c[TUMBLRFOX] %o', 'color:orange; font-size: 9pt', arguments);
    this.$debug.text(`[LOG]: ${JSON.stringify(arguments)}`);
  }
});

export default Debug;
