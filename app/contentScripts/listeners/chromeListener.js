import Listener from './listener';
import ChromeMixin from '../components/mixins/chromeMixin';
import Events from '../application/events';
import { clone, omit, pick } from 'lodash';

const ChromeListener = Listener.extend({
  mixins: [ChromeMixin],
  initialize() {
    this.bindEvents();
  },
  bindEvents() {
    window.addEventListener('response', e => {
      const response = e.detail;
      const type = response._type;
      delete response._type;
      Events.trigger(`chrome:${type}`, response);
    });
  }
});

module.exports = new ChromeListener();
