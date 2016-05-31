import $ from 'jquery';
import { isBoolean, mapKeys } from 'lodash';
import Backbone from 'backbone';
import View from '../view/view';
import settingsTemplate from './settings.html';

const Settings = View.extend({
  defaults: {
    props: {
      debug: false,
      setUser: false,
      defaultKeys: false
    }
  },
  template: $(settingsTemplate).html(),
  className: 'settings options',
  tagName: 'section',
  render() {
    this.$el.html(this.template);
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
    this.props.set(key, check);
    Backbone.Events.trigger('CHANGE_PROPS', this.props.attributes);
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
