import $ from 'jquery';
import Backbone from 'backbone';
import View from '../../view/view';
import debugTemplate from './debug.html';

const Debug = View.extend({
  defaults: {
    props: {
      debug: false
    }
  },
  template: $(debugTemplate).html(),
  className: 'debug--options',
  tagName: 'section',
  render() {
    this.listenTo(Backbone.Events, 'all', ::this.log);
    this.$el.html(this.template);
    this.$collapseButton = this.$el.find('#collapseButton');
    this.$debug = this.$el.find('#debugConsole');
    return this;
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
  },
  renderProps(props) {
    if (props.debug) {
      this.$el.show();
    } else {
      this.$el.hide();
    }
  }
});

export default Debug;
