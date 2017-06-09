/* global chrome:true */
/* global document:true */
/* global window:true */

import Bridge from './bridge';
import Inject from './moduleLoader';

if (window.top === window && 'chrome' in window) {
  console.log('@tumblr');
  Bridge.initialize().then(() => {
    Inject(['scripts/vendor.bundle.js']).then(() => {
       Inject(['scripts/fox-bootstrap.js']).then(() => {
         if (__ENV__ === 'development') {
           Inject(['scripts/tests.js']);
         }
       });
    });
  });
}
