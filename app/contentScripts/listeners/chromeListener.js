import Listener from './listener';
import ChromeMixin from '../components/mixins/chromeMixin';
import constants from '../application/constants';
import Events from '../application/events';
import { snakeCase } from 'lodash';

const ChromeListener = Listener.extend({
  mixins: [ChromeMixin],
  initialize() {
    this.bindEvents();
  },
  bindEvents() {
    // window.addEventListener('response', e => {
    //   const response = e.detail;
    //   Events.trigger(`chrome:${response.type}`, response.payload);
    // });
    window.addEventListener('message', event => {
      console.log(event.data);
      Events.trigger(`chrome:${event.data.type}`, event.data.payload);
    }, false);
  },
  normalize(eventName) {
    return `chrome:${snakeCase(eventName).replace(/_/g, ':')}`;
  }
});

module.exports = new ChromeListener();

// constants.eventManifest.forEach(eventName => {
//   Events.on(`fox:${eventName}`, () => {
//     this.chromeTrigger(this.normalize(eventName));
//   });
// });
