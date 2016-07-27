import $ from 'jquery';
import { isBoolean, mapKeys, snakeCase, template, toUpper } from 'lodash';
import Backbone from 'backbone';
import View from '../view/view';
import settingsTemplate from './settings.html';

const Settings = View.extend({
  defaults: {
    props: {
      debug: false,
      setUser: false,
      defaultKeys: false,
      test: false,
      clientTests: false,
      extensionTests: false
    }
  },
  template: template(settingsTemplate),
  className: 'settings options',
  tagName: 'section',
  render() {
    this.$el.html(this.template({ env: __ENV__ }));
    this.bindEvents();
    return this;
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
    console.log(key);
    if (key === 'extensionTests') {
      const eventName = toUpper(snakeCase(key));
      Backbone.Events.trigger(eventName, {
        type: key
      });
    } else {
      this.props.set(key, check);
    }
  },
  renderProps(props) {
    mapKeys(props, (value, key) => {
      if (isBoolean(value) && this.$el.find(`input#${key}`).attr('type') === 'checkbox') {
        this.$el.find(`input#${key}`).attr('checked', value);
      }
    });
  }
});

export default Settings;
