import Backbone from 'backbone';
import { snakeCase } from 'lodash';

const bindListeners = response => {
  Backbone.Events.trigger(snakeCase(response.type).toUpperCase(), response);
}

export default bindListeners;
