/* global chrome:true */
/* eslint no-undef: "error" */

import { camelCase } from 'lodash';
import constants from '../constants';

export function log(database, items, callback, save) {
  try {
    const cachedKey = camelCase(`cached-${database}-count`);
    const totalKey = camelCase(`total-${database}-count`);
    const { percentComplete, itemsLeft, total } = calculatePercent(items[cachedKey], items[totalKey]);
    if (typeof save === 'undefined' || save) {
      const storageSlug = {};
      storageSlug[cachedKey] = items[cachedKey];
      storageSlug[totalKey] = items[totalKey];
      chrome.storage.local.set(storageSlug);
      constants.set(storageSlug);
    }
    console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}`);
    callback({ constants, database, percentComplete, itemsLeft, total });
  } catch (e) {
    console.error(e);
    callback({ error: e });
  }
}

export function calculatePercent(count, objects) {
  const percentComplete = ((count / objects) * 100).toFixed(2);
  const itemsLeft = objects - count;
  const total = objects;
  return { percentComplete, itemsLeft, total };
}
