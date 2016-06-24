/* global chrome:true */
/* global window:true */
/* global CustomEvent:true */
/* global Event:true */
/* eslint no-undef: "error" */

import { camelCase } from 'lodash';

class Bridge {
  initialize() {
    this.bindOutgoing([
      'chrome:fetch:blogPosts',
      'chrome:fetch:dashboardPosts',
      'chrome:fetch:dashboardPostsByTag',
      'chrome:fetch:likes',
      'chrome:setFilter',
      'chrome:search:likesByTag',
      'chrome:search:likesByTerm',
      'chrome:fetch:constants',
      'chrome:fetch:following',
      'chrome:fetch:keys',
      'chrome:fetch:tagsByUser',
      'chrome:fetch:likedTags',
      'chrome:refresh:following',
      'chrome:update:following',
      'chrome:update:likes',
      'chrome:sync:like',
      'chrome:initialize'
    ]);
    chrome.runtime.onMessage.addListener(this.bindRecievers);
    console.log('[BRIDGE]: initialized');
  }

  listenTo(eventName, callback) {
    console.log(`[BRIDGE] listening: "${eventName}"`);
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
    } else {
      req = new CustomEvent(eventName, {
        detail: payload
      });
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

  bindOutgoing(handlers) {
    handlers.map(eventName => {
      this.listenTo(eventName, response => {
        console.log(`[BRIDGE] trigger: "${eventName}"`);
        if (response) {
          console.log('[BRIDGE] response:', response);
          let responseEvent = eventName.split(':');
          responseEvent[1] = 'response';
          responseEvent = responseEvent.join(':');
          this.trigger(responseEvent, response);
        }
      });
    });
  }
}

const bridge = new Bridge();

export default bridge;
