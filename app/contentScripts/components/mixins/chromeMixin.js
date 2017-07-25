import { last, snakeCase, uniqueId } from 'lodash';
import ComponentFetcher from '../../utils/componentFetcherUtil';
import chromeTrigger from '../../utils/chromeTrigger';
import Events from '../../application/events';

const Mixin = ComponentFetcher.get('Mixin');

/**
 * @param {String} eventName The name of the window event corresponding to a chrome action
 * @param {String} payload The data to send to the extension backend
 * @param {String} callback Optional function to perform on response
 */

const ChromeMixin = new Mixin({
  chromeTrigger: chromeTrigger,
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
