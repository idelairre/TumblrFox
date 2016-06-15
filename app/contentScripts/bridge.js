/* global chrome:true */
/* global window:true */
/* global CustomEvent:true */
/* global Event:true */
/* eslint no-undef: "error" */

import { camelCase } from 'lodash';

const Bridge = {
  initialize() {
    this.bindListeners([ // binds window events coming from injected scripts
      'chrome:fetch:blogPosts',
      'chrome:fetch:dashboardPosts',
      'chrome:fetch:dashboardPostsByTag',
      'chrome:fetch:likes',
      'chrome:search:likesByTag',
      'chrome:search:likesByTerm',
      'chrome:fetch:constants',
      'chrome:fetch:following',
      'chrome:fetch:keys',
      'chrome:fetch:tags',
      'chrome:refresh:following',
      'chrome:update:following',
      'chrome:update:likes',
      'chrome:sync:likes',
      'chrome:initialize'
    ]);
  },
  listenTo(eventName, callback) {
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
  },
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
  },
  bindListeners(handlers) {
    handlers.map(eventName => {
      this.listenTo(eventName, response => {
        if (response) {
          let responseEvent = eventName.split(':');
          responseEvent[1] = 'response';
          responseEvent = responseEvent.join(':');
          this.trigger(responseEvent, response);
        }
      });
    });
  }
};

export default Bridge;
