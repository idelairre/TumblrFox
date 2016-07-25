import Events from '../../application/events';
import Listener from '../../listeners/listener';
import { template } from 'lodash';
import errorTemplate from './errorTemplate.html';

const ErrorComponent = Listener.extend({
  initialize() {
    this.listenTo(Events, 'chrome:response:error', ::this.handleError);
  },
  handleError(e) {
    const error = e.payload.error;
    console.error(e.payload.stack);

    Tumblr.Dialog.alert({
      templates: {
        content: template(errorTemplate)({ error })
      }
    });
  }
});

module.exports = new ErrorComponent();
