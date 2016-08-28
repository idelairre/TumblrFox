import $ from 'jquery';
import Backbone from 'backbone';
import template from 'lodash.template'
import snakeCase from '../../utils/snakeCase';
import View from '../view/view';
import settingsTemplate from './settings.html';

const Settings = View.extend({
  defaults: {
    props: {
      debug: false,
      env: 'development',
      setUser: false,
      defaultKeys: false,
      test: false,
      clientTests: false,
      extensionTests: false
    }
  },
  template: template(settingsTemplate),
  className: 'settings',
  tagName: 'section',
  initialize() {
    this.bindEvents();
  },
  render() {
    this.$el.html(this.template({ props: this.props.attributes }));
  },
  events: {
    'click [type=checkbox]': 'toggleCheck'
  },
  bindEvents() {
    this.listenTo(Backbone.Events, 'CACHE_LIKES', this.postMessage);
  },
  toggleCheck(e) {
    const check = e.target.checked;
    const key = this.$(e.currentTarget).prop('id');
    if (key === 'extensionTests') {
      const eventName = snakeCase(key).toUpperCase();
      Backbone.Events.trigger(eventName, {
        type: key
      });
    } else {
      this.props.set(key, check);
    }
  }
});

export default Settings;
