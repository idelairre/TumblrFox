/* global chrome:true */
/* global window:true */
/* global CustomEvent:true */
/* global Event:true */
/* eslint no-undef: "error" */

import { camelCase, capitalize, first, last, snakeCase, replace, omit } from 'lodash';

const log = console.log.bind(console, '[BRIDGE]');

class Bridge {
  initialize() {
    chrome.runtime.onMessage.addListener(::this.bindRecievers);
    this.bindOutgoing();
  }

  debug() { // NOTE: there is a slight delay here, not sure why
    if (this.logging) {
      log.apply(log, Array.prototype.slice.call(arguments));
    }
  }

  trigger(eventName, payload) {
    if (typeof payload === 'undefined') {
      payload = {};
    }
    payload._type = eventName;
    const req = new CustomEvent('response', {
      detail: payload
    });
    this.debug(`trigger: "${eventName}"`, payload);
    window.dispatchEvent(req);
  }

  bindErrorHandler(request) {
    if (request.type === 'error') {
      console.error(request);
    }
  }

  bindRecievers(request) {
    console.log(request, this);
    if (request.payload) {
      this.trigger(`chrome:response:${request.type}`, request.payload);
    } else {
      this.trigger(`chrome:response:${request.type}`);
    }
  }

  bindOutgoing() {
    window.addEventListener('request', e => {
      try {
        const eventName = camelCase(e.detail._type.split(':').splice(1).join(' '));
        const req = {
          type: eventName,
          payload: e.detail.data
        };
        chrome.runtime.sendMessage(req, response => {
          if (response) {
            const responseName = last(snakeCase(eventName).split('_'));
            this.trigger(`response:${responseName}:${e.detail._id}`, response);
          }
        });
      } catch (err) {
        console.error(err, e);
      }
    });
    this.debug('initialized');
  }
}

const bridge = new Bridge();

export default bridge;
