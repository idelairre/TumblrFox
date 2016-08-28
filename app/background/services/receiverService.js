import { debug } from './loggingService';
import sendMessage from './messageService';
import constants from '../constants';

/**
 * takes a list of handlers as object and play role of middleware when events occured.
 * NOTE: only use static classes for this or terrible things happen
 *
 * @return function middleware to process requests.
 */

const errorHandler = (sendResponse, err) => {
	console.error(err);
	if (typeof err === 'object' && {}.hasOwnProperty.call(err, 'statusText')) {
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
	constants.set('eventManifest', Object.keys(handlers));
	return (request, sender, sendResponse) => {
		const handleError = errorHandler.bind(this, sendResponse);
		const lastError = chrome.runtime.lastError; // NOTE: not sure if this works
		if (lastError) {
			sendResponse({
				type: 'error',
				payload: {
					error: lastError.message,
					stack: lastError
				}
			});
			console.error(lastError.message);
		}
		console.log('[REQUEST]: ', request.type);
		if ({}.hasOwnProperty.call(handlers, request.type)) {
			const func = handlers[request.type](request.payload);
			if (typeof func !== 'undefined') {
				if (func instanceof Promise) {
					func.then(response => {
						if (typeof response !== 'undefined') {
							sendResponse(response);
						}
					}).catch(handleError);
				} else {
					sendResponse(func);
				}
			}
		}
	return true;
	};
};

export default receiverHandler;
