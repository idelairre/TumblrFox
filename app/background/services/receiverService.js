import { defaultTo, has } from 'lodash';
import browser from '../lib/browserPolyfill';

/**
 * takes a list of handlers as object and play role of middleware when events occured.
 * NOTE: only use static classes for this or terrible things happen
 *
 * @return function middleware to process requests.
 */

const errorHandler = (sendResponse, err) => {
  console.error(err);
  if (typeof err === 'object' && has(err, 'statusText')) {
    sendResponse({
      type: 'error',
      payload: {
        error: err.statusText,
        stack: err
      }
    });
  } else {
    sendResponse({
      type: 'error',
      payload: {
        error: err.toString(),
        stack: err.stack
      }
    });
  }
}

const receiverHandler = handlers => {
  // constants.set('eventManifest', Object.keys(handlers));

  return (request, sender, sendResponse) => {
    const lastError = browser.runtime.lastError; // NOTE: not sure if this works

    if (lastError) {
      sendResponse(lastError);
      console.error(lastError);
      // {
      //   type: 'error',
      //   payload: {
      //     error: lastError.message,
      //     stack: lastError
      //   }
      // }
    }

    console.log('[REQUEST]: ', request.type);

    if (has(handlers, request.type)) {
      const response = handlers[request.type](defaultTo(request.payload, {}));
      try {
        if (response instanceof Promise) {
          response.then(sendResponse);
        } else {
          sendResponse(response);
        }
      } catch (err) {
        console.error(err);
        sendResponse(err);
      }
    } else {
      sendResponse({ type: 'error', payload: 'function not found' });
    }

  	return true;
  }
}

export default receiverHandler;
