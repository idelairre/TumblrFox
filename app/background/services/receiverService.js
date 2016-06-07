/**
 * takes a list of handlers as object and play role of middleware when events occured.
 *
 * @return function middleware to process request.
 */

const receiverHandler = handlers => {
	return (request, sender, sendResponse) => {
		const { type } = request;
		if (handlers.hasOwnProperty(type)) {
			handlers[type](request, sender, sendResponse);
		}
	return true;
	};
};

export default receiverHandler;
