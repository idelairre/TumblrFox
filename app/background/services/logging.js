/* global chrome:true */
/* eslint no-undef: "error" */

import { camelCase } from 'lodash';
import constants from '../constants';

export const log = (database, items, callback, save) => {
  try {
    const cachedKey = camelCase(`cached-${database}-count`);
    const totalKey = camelCase(`total-${database}-count`);
    const { percentComplete, itemsLeft, total } = calculatePercent(items[cachedKey], items[totalKey]);
    if (typeof save === 'undefined' || save) {
      if (typeof constants.get(`${cachedKey}`) !== 'undefined '&& constants.get(`${totalKey}`) !== 'undefined') {
        const storageSlug = {};
        storageSlug[cachedKey] = items[cachedKey];
        storageSlug[totalKey] = items[totalKey];
        constants.set(storageSlug);
      }
    }
    // console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}`);
    callback({
      type: 'progress',
      payload: { constants, database, percentComplete, itemsLeft, total }
    });
  } catch (e) {
    console.error(e);
    callback({ error: e });
  }
}

export const calculatePercent = (count, objects) => {
  const percentComplete = ((count / objects) * 100).toFixed(2);
  const itemsLeft = objects - count;
  const total = objects;
  return { percentComplete, itemsLeft, total };
}

export const logError = (error, next, port) => {
  console.log(error);
  let isAsync = true;
  if (!port) {
    port = next;
    isAsync = false;
  }
  port({
    type: 'error',
    payload: {
      message: error
    }
  });
  if (isAsync) {
    next(error);
  }
}
