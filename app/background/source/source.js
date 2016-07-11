import constants from '../constants';
import { ajax, Deferred } from 'jquery';
import { debug } from '../services/loggingService';
import { noop } from 'lodash';

console.log(constants);

export default class Source {
  initialized = false;
  retryTimes = 3;
  retriedTimes = 0;
  MAX_RETRIES_MESSAGE = 'Max retries reached, either there is a connection error or you have reached the maximum items you can fetch.';
  MAX_ITEMS_MESSAGE = 'Maximum fetchable items reached.';

  constructor() {
    this.constants = constants;
    this.constants.once('ready', () => {
      this._initialize.apply(this);
      this.initialized = true;
    });
    this.constants.on('reset', () => {
      this._initialize.apply(this);
    });
  }

  _initialize() {
    if (this.options) {
      this.defaults = Object.assign({}, this.options);
    }
    if (typeof this.initializeConstants === 'function') {
      this.initializeConstants();
    }
  }

  start(options) {
    if (options) {
      Object.assign(this.options, options);
    }
    if (this.initialized) {
      return this.run();
    } else {
      this.constants.once('ready', () => {
        return this.run();
      });
    }
  }

  async fetch() {
    const deferred = Deferred();
    ajax({
      type: 'GET',
      url: this.options.url,
      success: data => {
        if (typeof this.parse === 'function') {
          const processedData = this.parse(data);
          deferred.resolve(processedData);
        } else {
          deferred.resolve(data);
        }
      },
      error: e => {
        deferred.reject(e);
      }
    });
    return deferred.promise();
  }

  async crawl(opts, retry) {
    const deferred = Deferred();
    try {
      if (retry && this.retriedTimes && this.retriedTimes <= this.retryTimes) {
        debug(`Retried times: ${this.retriedTimes + 1}, retrying from ${opts.iterator}: ${this.options[opts.iterator]}...`);
      }
      const items = await this.fetch();
      debug(`✔ Crawled ${items.length} ${this.options.item} from ${opts.iterator}: ${this.options[opts.iterator]}`);
      deferred.resolve(items);
    } catch (e) {
      deferred.reject(e);
    }
    return deferred.promise();
  }

  async run(retry) {
    const deferred = Deferred();
    try {
      if (!this.condition()) { // NOTE: condition represents what must be true for run to crawl
        return deferred.resolve([]);
      }
      const posts = await this.crawl({
        iterator: this.options.iterator,
        item: this.options.item,
        callback: this.process
      }, retry);
      this.retriedTimes = 0;
      if (typeof this.step === 'function') {
        this.step();
      }
      deferred.resolve(posts);
    } catch (error) {
      if (this.retriedTimes <= (this.retryTimes - 1)) {
        this.handleError(error);
      } else {
        console.info(this.MAX_RETRIES_MESSAGE);
        deferred.reject(error);
      }
    }
    return deferred.promise();
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

  reset() {
    return this.initialize();
  }
}
