/* global chrome:true */
/* global document:true */
/* global window:true */

import { Inject } from './moduleLoader';
import Bridge from './bridge';
import { mapKeys } from 'lodash';

if (window.top === window && 'chrome' in window) {
  console.log('@tumblr');
  Bridge.initialize().then(() => {
    Inject(['scripts/vendor.bundle.js']).then(() => {
       Inject(['scripts/fox-bootstrap.js']);
    });
  });
}
