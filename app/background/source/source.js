import constants from '../constants';

export default class Source {
  initialized = false;
  retryTimes = 3;
  retriedTimes = 0;
  MAX_RETRIES_MESSAGE = 'Max retries reached, either there is a connection error or you have reached the maximum items you can fetch.';

  constructor() {
    this.constants = constants;
    this.constants.addListener('ready', () => {
      this.initialized = true;
    });
  }

  start(retry, refresh) {
    if (this.initialized) {
      return this._run(retry);
    } else {
      this.constants.addListener('ready', () => {
        return this._run(retry);
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
      return this._run(true);
    }, 3000);
  }
}
