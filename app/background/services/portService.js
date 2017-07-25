import { has } from 'lodash';

let port;

const portHandler = handlers => {
	return $port => {
		port = $port;
		port.onMessage.addListener(request => {
			const { payload, type } = request;
			if (has(handlers, type)) {
				if (payload) {
					handlers[type](payload, ::port.postMessage);
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
