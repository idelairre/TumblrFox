/* global chrome:true, browser:true */
/* global window:true */

import Bridge from './bridge';
import Inject from './moduleLoader';

const atTumblr = window.top === window; // && ('chrome' in window || 'browser' in window);

async function init() {
  try {
    await Bridge.initialize();
    await Inject(['scripts/vendor.bundle.js']);
    await Inject(['scripts/fox-bootstrap.js']);
    if (__ENV__ === 'development') {
      Inject(['scripts/tests.js']);
    }
  } catch (err) {
    console.error(err);
  }
}

if (atTumblr) {
  console.log('@tumblr');
  init();
}
