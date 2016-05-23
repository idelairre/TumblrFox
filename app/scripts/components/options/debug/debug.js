import $ from 'jquery';
import Backbone from 'backbone';
import debugTemplate from './debug.html';

const Debug = Backbone.View.extend({
  template: $(debugTemplate).html(),
  className: 'debug--options',
  tagName: 'section',
  initialize(e) {
    this.props = e;
  },
  render() {
    this.rendered = true;
    this.$el.html(this.template);
    this.$collapseButton = this.$el.find('#collapseButton');
    this.$debug = this.$el.find('#debugConsole');
    Backbone.View.prototype.render.apply(this, arguments);
    this.setProps();
    this.bindEvents();
  },
  events: {
    'click #collapseButton': 'collapse'
  },
  collapse() {
    if (!this.collapsed) {
      this.collapsed = true;
      this.$collapseButton.text('+');
      // this.$el.find('.debug').css('overflow', 'hidden');
      this.$el.find('.debug').css('height', '45px');

    } else {
      this.collapsed = false;
      this.$collapseButton.text('-');
      // this.$el.find('.debug').css('overflow', 'scroll');
      this.$el.find('.debug').css('height', '100px');
    }
  },
  bindEvents() {
    this.listenTo(this.props, 'change:debug', ::this.renderProps);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', this.setProps);
  },
  setProps(newProps) {
    this.props.set(newProps);
  },
  log() {
    console.log('%c[TUMBLRFOX] %o', 'color:orange; font-size: 9pt', arguments);
    this.$debug.text(`[LOG]: ${JSON.stringify(arguments)}`);
  },
  renderProps() {
    if (this.props.get('debug')) {
      this.$el.show();
      this.listenTo(Backbone.Events, 'all', ::this.log);
    } else {
      this.$el.hide();
      this.stopListening(Backbone.Events, 'all');
    }
  }
});

export default Debug;
