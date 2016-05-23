import $ from 'jquery';
import { isNumber, mapKeys, snakeCase, toUpper } from 'lodash';
import Backbone from 'backbone';
import cacheTemplate from './cache.html';

const Cache = Backbone.View.extend({
  template: $(cacheTemplate).html(),
  className: 'cache options',
  tagName: 'section',
  initialize(e) {
    this.props = e;
  },
  render() {
    this.rendered = true;
    this.$el.html(this.template);
    Backbone.View.prototype.render.apply(this, arguments);
    this.setProps();
    this.bindEvents();
  },
  events: {
    'click button': 'toggleButton'
  },
  toggleButton(e) {
    console.log('[BUTTON PRESS]');
    const key = this.$(e.currentTarget).prop('id');
    const event = toUpper(snakeCase(key));
    Backbone.Events.trigger(event, { action: key });
  },
  bindEvents() {
    this.listenTo(this.props, 'change', ::this.renderProps);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', this.setProps);
  },
  setProps(newProps) {
    this.props.set(newProps);
  },
  renderProps() {
    mapKeys(this.props.attributes, (value, key) => {
      if (isNumber(value)) {
        this.$el.find(`span#${key}`).text(value);
      }
    });
  }
});

export default Cache;
