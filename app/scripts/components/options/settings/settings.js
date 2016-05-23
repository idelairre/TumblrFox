import $ from 'jquery';
import { isBoolean, mapKeys } from 'lodash';
import Backbone from 'backbone';
import settingsTemplate from './settings.html';

const Settings = Backbone.View.extend({
  template: $(settingsTemplate).html(),
  className: 'settings options',
  tagName: 'section',
  initialize(e) {
    this.props = e;
  },
  render() {
    this.rendered = true;
    this.$el.html(this.template);
    Backbone.View.prototype.render.apply(this, arguments);
    this.bindEvents();
  },
  events: {
    'click [type=checkbox]': 'toggleCheck'
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'INITIALIZED', this.renderProps);
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', this.setProps);
    this.listenTo(Backbone.Events, 'CACHE_LIKES', this.postMessage);
    this.listenTo(this.props, 'change', this.renderProps);
  },
  toggleCheck(e) {
    const check = e.target.checked;
    const key = this.$(e.currentTarget).prop('id');
    this.props.set(key, check);
    Backbone.Events.trigger('CHANGE_PROPS', this.props.attributes);
  },
  setProps(newProps) {
    this.props.set(newProps);
  },
  renderProps() {
    mapKeys(this.props.attributes, (value, key) => {
      if (isBoolean(value) && this.$el.find(`input#${key}`).attr('type') === 'checkbox') {
        this.$el.find(`input#${key}`).attr('checked', value);
      }
    });
  }
});

export default Settings;
