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
    this.listenTo(Backbone.Events, 'CHANGE_PROPS', ::this.setProps);
    this.listenTo(Backbone.Events, 'CACHE_LIKES', this.postMessage);
    this.listenTo(this.props, 'change', this.renderProps);
    // this.listenTo(this.props, 'change:saveAsCsv', ::this.checkFirebaseSetting);
    // this.listenTo(this.props, 'change:saveViaFirebase', ::this.checkFirebaseSetting);
  },
  toggleCheck(e) {
    const check = e.target.checked;
    const key = this.$(e.currentTarget).prop('id');
    this.props.set(key, check);
    Backbone.Events.trigger('CHANGE_PROPS', this.props.attributes);
  },
  checkFirebaseSetting() {
    if (this.props.get('saveViaFirebase') && this.props.get('saveAsCsv')) {
      // this.props.set('saveViaFirebase', false);
      // TODO: maybe disable the saveViaFirebase input?
      // Backbone.Events.trigger('CHANGE_PROPS', this.props.attributes);
    }
  },
  setProps(newProps) {
    console.log('[CHANGING PROPS]', newProps, this.props.attributes);
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
