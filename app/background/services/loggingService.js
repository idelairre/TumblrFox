import { camelCase } from 'lodash';
import constants from '../constants';

export const calculatePercent = (count, objects) => {
  const percentComplete = ((count / objects) * 100).toFixed(2);
  const itemsLeft = objects - count;
  const total = objects;
  return { percentComplete, itemsLeft, total };
};

export const log = (database, items, sendResponse, save) => {
  try {
    const cachedKey = camelCase(`cached-${database}-count`);
    const totalKey = camelCase(`total-${database}-count`);
    const { percentComplete, itemsLeft, total } = calculatePercent(items[cachedKey], items[totalKey]);
    if (typeof save === 'undefined' || save) {
      if (typeof constants.get(`${cachedKey}`) !== 'undefined ' && typeof constants.get(`${totalKey}`) !== 'undefined') {
        const storageSlug = {};
        storageSlug[cachedKey] = items[cachedKey];
        storageSlug[totalKey] = items[totalKey];
        constants.set(storageSlug);
      }
    }

    const payload = {
      constants,
      database,
      percentComplete,
      itemsLeft,
      total
    };
    // console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}`);
    if (itemsLeft === 0) {
      sendResponse({
        type: 'done',
        payload,
        message: 'Finished processing items'
      });
    } else {
      sendResponse({
        type: 'progress',
        payload
      });
    }
  } catch (e) {
    console.error(e);
    logError(e, callback);
  }
};

export const logError = (error, next, sendResponse) => {
  console.error(error);
  if (error.message) {
    error = error.message;
  }
  if (error.responseText) {
    error = error.responseText;
  }
  let isAsync = true;
  if (!sendResponse) {
    sendResponse = next;
    isAsync = false;
  }
  sendResponse({
    type: 'error',
    payload: {
      message: error
    }
  });
  if (isAsync) {
    next(error);
  }
};
