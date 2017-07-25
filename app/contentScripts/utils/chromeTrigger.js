import { last, snakeCase, uniqueId } from 'lodash';
import Events from '../application/events';

function chromeTrigger(eventName, data, callback) {
  if (!callback && typeof data === 'function') {
    callback = data;
    data = false;
  }

  const payload = {
    _id: uniqueId(),
    _type: eventName
  };

  if (data) {
    payload.data = data;
  }
  const req = new CustomEvent('request', {
    detail: payload
  });
  const responseName = `chrome:response:${last(snakeCase(eventName).split('_'))}:${payload._id}`;

  Events.once(responseName, callback);

  window.dispatchEvent(req);
}

export default chromeTrigger;
