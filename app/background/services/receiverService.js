import { isFunction } from 'lodash';

/**
 * takes a list of handlers as object and play role of middleware when events occured.
 *
 * @return function middleware to process request.
 */

const receiverHandler = handlers => {
	console.log('[HANDLERS]: ', handlers);
	return (request, sender, sendResponse) => {
		console.log('[REQUEST]: ', request.type);
		if (handlers.hasOwnProperty(request.type)) {
			if (request.payload) {
				const func = handlers[request.type](request.payload);
				if (func instanceof Promise) {
					func.then(response => {
						if (response) {
							sendResponse(response);
						}
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
						if (response) {
							sendResponse(response);
						}
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
