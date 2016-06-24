import constants from '../constants';
import { noop } from 'lodash';

export default class Source {
  initialized = false;
  retryTimes = 3;
  retriedTimes = 0;
  MAX_RETRIES_MESSAGE = 'Max retries reached, either there is a connection error or you have reached the maximum items you can fetch.';
  MAX_ITEMS_MESSAGE = 'Maximum fetchable items reached.';

  constructor() {
    this.constants = constants;
    this.constants.on('ready', () => {
      this.initialized = true;
    });
  }

  start(retry, refresh) {
    if (this.initialized) {
      return this.run(retry);
    } else {
      this.constants.on('ready', () => {
        return this.run(retry);
      });
    }
  }

  handleError(error) {
    if (error.status && error.statusText) {
      console.error('Code: \'%s\', Message: \'%s\'', error.status, error.statusText);
    } else {
      console.error(error);
    }
    if (this.retryTimes - this.retriedTimes) {
      console.log(`Retry in 3s... will retry ${(this.retryTimes) - this.retriedTimes} more time(s)`);
    } else {
      console.log('Retry in 3s...');
    }
    setTimeout(() => {
      this.retriedTimes += 1;
      return this.run(true);
    }, 3000);
  }

  run() {
    return noop;
  }
}
