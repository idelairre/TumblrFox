import { camelCase, isFunction } from 'lodash';
import constants from '../constants';

const log = console.log.bind(console, '[TUMBLRFOX]');

export const debug = (...args) => {
  if (typeof constants.get('debug') === 'undefined') {
    constants.once('ready', () => {
      if (constants.get('debug')) {
        log.call(log, ...args);
      }
    });
  } else {
    if (constants.get('debug')) {
      log.call(log, ...args);
    }
  }
}

export const calculatePercent = (count, total) => {
  const percentComplete = ((count / total) * 100).toFixed(2);
  const itemsLeft = total - count;
  return { percentComplete, itemsLeft, total };
};

export const logValues = (database, sendResponse, callback) => {
  try {
    const cachedKey = camelCase(`cached-${database}-count`);
    const totalKey = camelCase(`total-${database}-count`);
    const { percentComplete, itemsLeft, total } = calculatePercent(constants.get(cachedKey), constants.get(totalKey));

    const changed = {
      [cachedKey]: constants.get(cachedKey)
    };
    const payload = { constants: changed, database, percentComplete, itemsLeft, total };

    if (sendResponse) {
      sendResponse({
        type: 'progress',
        payload
      });
    }

    if (callback) {
      callback(payload);
    }
  } catch (e) {
    console.error(e);
    logError(e);
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
  if (!isFunction(sendResponse) && isFunction(next)) {
    sendResponse = next;
    isAsync = false;
  }
  if (isFunction(sendResponse)) {
    sendResponse({
      type: 'error',
      payload: {
        message: error
      }
    });
  }
  if (isAsync && isFunction(next)) {
    next(error);
  }
};
