import Events from '../../application/events';
import Listener from '../../listeners/listener';
import { isObject, template } from 'lodash';
import errorTemplate from './errorTemplate.html';

const ErrorComponent = Listener.extend({
  initialize() {
    this.listenTo(Events, 'chrome:response:error', ::this.handleError);
  },
  handleError(e) {
    let error = e.payload.error;

    console.error(error);

    if (isObject(error)) {
      error = JSON.stringify(error);
    }
    
    if (e.payload.stack) {
      console.error(e.payload.stack);
    }

    Tumblr.Dialog.alert({
      templates: {
        content: template(errorTemplate)({ error })
      }
    });
  }
});

module.exports = new ErrorComponent();
