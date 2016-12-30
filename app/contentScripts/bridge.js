/* global chrome:true */
/* global window:true */
/* global CustomEvent:true */
/* global Event:true */
/* eslint no-undef: "error" */

import B64 from './utils/b64Util';
import camelCase from '../background/utils/camelCase';
import snakeCase from '../background/utils/snakeCase';
import { Deferred } from 'jquery';

const log = console.log.bind(console, '[BRIDGE]');

class Bridge {
  initialize() {
    const deferred = Deferred();
    chrome.runtime.sendMessage({
      type: 'fetchConstants'
    }, response => {
      this.logging = response.debug;
      this.injectConstants(response);
      chrome.runtime.onMessage.addListener(::this.bindRecievers);
      this.bindOutgoing();
      deferred.resolve();
    });
    return deferred.promise();
  }

  debug() { // NOTE: there is a slight delay here, not sure why
    if (this.logging) {
      log.apply(log, Array.from(arguments));
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

  injectConstants(constants) {
    if (!constants) {
      return;
    }
    const module = document.createElement('script');
    module.type = 'text/javascript';
    module.title = 'tumblr-fox-constants';
    module.textContent = `window.tumblrFoxConstants = "${B64.encodeUnicode(JSON.stringify(constants))}"`;
    document.body.appendChild(module);
    module.onload = function() {
      this.remove();
    };
  }

  bindRecievers(request) {
    this.debug(request, this);
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
          const responseArr = snakeCase(eventName).split('_');
          const responseName = responseArr[responseArr.length - 1];
          const payload = {
            payload: response,
            type: responseName
          };
          if (response && response.type === 'error') {
            this.trigger(`response:error`, payload);
          } else if (response) {
            this.trigger(`response:${responseName}:${e.detail._id}`, payload);
          }
        });
      } catch (err) {
        console.error(err);
        console.error(e);
      }
    });
    this.debug('initialized');
    this.trigger('chrome:bridge:initialized');
  }
}

const bridge = new Bridge();

export default bridge;
