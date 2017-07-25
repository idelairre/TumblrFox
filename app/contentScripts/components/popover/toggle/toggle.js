import $ from 'jquery';
import { View, Model } from 'backbone';
import { template } from 'lodash';
import toggleTemplate from './toggle.html';

const Toggle = View.extend({
  template: template(toggleTemplate),
  tagName: 'a',
  events: {
    'click': 'toggle'
  },
  initialize(options) {
    this.options = Object.assign({}, options);
    this.state = new Model({
      toggled: false,
      disabled: false
    }),
    this.bindEvents();
  },
  render() {
    this.$el.html(this.template(this.options));
    this.$el.addClass(`toggle-${this.options.name}`);
    this.$el.prop('href', '#');
    this.$button = this.$el.find('.indicator');
    this.rendered = true; // NOTE: all tumblr subviews must alert that they have been rendered or the parent component won't call "afterRender()"
  },
  bindEvents() {
    this.listenTo(this.state, 'change:toggled', ::this.setState);
  },
  toggle(e) {
    this.state.set('toggled', !this.state.get('toggled'));
  },
  setState(toggled) {
    if (this.state.get('toggled')) {
      this.$button.text('-');
    } else if (!this.state.get('toggled')) {
      this.$button.text('+');
    } else if (this.state.get('disabled')) {
      this.state.set('toggled', false);
      this.undelegateEvents();
      this.stopListening();
    }
  }
});

module.exports = Toggle;
