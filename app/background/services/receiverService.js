import { isFunction, toArray } from 'lodash';
import sendMessage from './messageService';
import constants from '../constants';

/**
 * takes a list of handlers as object and play role of middleware when events occured.
 *
 * @return function middleware to process request.
 */

const receiverHandler = handlers => {
	// console.log('[HANDLERS]: ', Object.keys(handlers));
	constants.set('eventManifest', Object.keys(handlers));
	return (request, sender, sendResponse) => {
		const lastError = chrome.runtime.lastError;
		if (lastError) {
			sendResponse({
				type: 'error',
				payload: lastError.message
			});
			console.error(lastError.message);
		}
		console.log('[REQUEST]: ', request.type);
		if (handlers.hasOwnProperty(request.type)) {
			if (request.payload) {
				const func = handlers[request.type](request.payload);
				if (func instanceof Promise) {
					func.then(response => {
						console.log(response);
						if (typeof response !== 'undefined') {
							sendResponse(response);
						}
					}, error => {
						console.log(error);
						sendResponse({
							type: 'error',
							payload: error
						});
					});
				} else {
					if (typeof func !== 'undefined') {
						sendResponse(func);
					}
				}
			} else {
				const func = handlers[request.type]();
				if (func instanceof Promise) {
					func.then(response => {
						if (typeof response !== 'undefined') {
							sendResponse(response);
						}
					}, error => {
						sendResponse({
							type: 'error',
							payload: error
						});
					});
				} else {
					if (typeof func !== 'undefined') {
						sendResponse(func);
					}
				}
			}
		}
	return true;
	};
};

export default receiverHandler;
