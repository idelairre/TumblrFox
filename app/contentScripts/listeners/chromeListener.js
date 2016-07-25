import Listener from './listener';
import ChromeMixin from '../components/mixins/chromeMixin';
import constants from '../application/constants';
import Events from '../application/events';
import { clone, omit, pick, snakeCase } from 'lodash';

const ChromeListener = Listener.extend({
  mixins: [ChromeMixin],
  initialize() {
    this.bindEvents();
  },
  bindEvents() {
    window.addEventListener('response', e => {
      const response = e.detail;
      const type = response._type;
      const payload = response.payload;
      Events.trigger(`chrome:${type}`, payload);
    });
    // constants.eventManifest.forEach(eventName => {
    //   Events.on(`fox:${eventName}`, () => {
    //     this.chromeTrigger(this.normalize(eventName));
    //   });
    // });
  },
  normalize(eventName) {
    return `chrome:${snakeCase(eventName).replace(/_/g, ':')}`;
  }
});

module.exports = new ChromeListener();
