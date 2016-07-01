/* global chrome:true */
/* global window:true */
/* global CustomEvent:true */
/* global Event:true */
/* eslint no-undef: "error" */

import { camelCase, capitalize, first, last, snakeCase, replace } from 'lodash';

const log = console.log.bind(console, '[BRIDGE]');

class Bridge {
  initialize() {
    const fetchConstants = {
      type: 'fetchConstants'
    };
    chrome.runtime.onMessage.addListener(this.bindRecievers);
    chrome.runtime.sendMessage(fetchConstants, ::this.bindOutgoing);
  }

  debug() { // NOTE: there is a slight delay here, not sure why
    if (this.logging) {
      log.apply(log, Array.prototype.slice.call(arguments));
    }
  }

  listenTo(eventName, callback) {
    this.debug(`listening: "${eventName}"`);
    const eventSlug = camelCase(eventName.split(':').splice(1).join(' '));
    window.addEventListener(eventName, e => {
      const req = {};
      if (e.detail) {
        req.payload = e.detail;
      }
      req.type = eventSlug;
      chrome.runtime.sendMessage(req, response => {
        return callback ? callback(response) : null;
      });
    });
  }

  trigger(eventName, payload) {
    let req = {};
    if (typeof payload === 'undefined') {
      req = new Event(eventName);
      this.debug(`trigger: "${eventName}"`);
    } else {
      req = new CustomEvent(eventName, {
        detail: payload
      });
      this.debug(`trigger: "${eventName}"`, payload);
    }
    window.dispatchEvent(req);
  }

  bindRecievers(request) {
    if (request.payload) {
      Bridge.trigger(`chrome:response:${request.type}`, request.payload);
    } else {
      Bridge.trigger(`chrome:response:${request.type}`);
    }
  }

  bindOutgoing(constants) {
    this.logging = constants.debug;
    const handlers = constants.eventManifest;
    handlers.map(eventName => {
      const splitName = snakeCase(eventName).split('_');
      const action = first(splitName);
      const object = camelCase(replace(eventName, action, ''));
      eventName = `chrome:${action}:${object}`;
      this.listenTo(eventName, response => {
        if (response) {
          let responseEvent = eventName.split(':');
          responseEvent[1] = 'response';
          responseEvent = responseEvent.join(':');
          this.trigger(responseEvent, response);
        }
      });
    });
    this.trigger('bridge:initialized');
    this.debug('initialized');
  }
}

const bridge = new Bridge();

export default bridge;
