import { has } from 'lodash';

let port;

const portHandler = handlers => {
	return $port => {
		port = $port;
		port.onMessage.addListener(request => {
			const { type } = request;
			if (has(handlers, type)) {
				if (request.payload) {
					handlers[type](request.payload, ::port.postMessage);
				} else {
					handlers[type](::port.postMessage);
				}
			}
			return true;
		});
		port.onDisconnect.addListener(() => {
			port = null;
		});
	};
};

export default portHandler;
