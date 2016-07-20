import { last, snakeCase, omit, uniqueId } from 'lodash';
import { ComponentFetcher } from '../../utils';
import Events from '../../application/events';
import Mixin from './mixin';

/**
 * @param {String} eventName The name of the window event corresponding to a chrome action
 * @param {String} payload The data to send to the extension backend
 * @param {String} callback Optional function to perform on response
 */

const ChromeMixin = new Mixin({
  chromeTrigger(eventName, data, callback) {
    if (!callback && typeof data === 'function') {
      callback = data;
      data = false;
    }
    const payload = {};
    payload._id = uniqueId();
    payload._type = eventName;
    if (data) {
      payload.data = data;
    }
    const req = new CustomEvent('request', {
      detail: payload
    });
    const responseName = `chrome:response:${last(snakeCase(eventName).split('_'))}:${payload._id}`;

    Events.once(responseName, callback);

    window.dispatchEvent(req);
  },
  chromeListenToOnce(eventName, callback) {
    const onEvent = e => {
      if (e.detail) {
        callback(e.detail);
        window.removeeventlistener(eventName, onEvent);
      }
    }
    window.addEventListener(eventName, onEvent);
  }
});

module.exports = ChromeMixin;
