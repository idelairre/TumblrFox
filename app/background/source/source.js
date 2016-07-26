import { ajax, Deferred } from 'jquery';
import EventEmitter from 'eventemitter3';
import constants from '../constants';
import { debug } from '../services/loggingService';

export default class Source extends EventEmitter { // TODO: refactor this into an event emitter than can be interrupted
  initialized = false;
  stopFlag = false;
  sync = false;
  retryTimes = 3;
  retriedTimes = 0;
  TIMEOUT_MESSAGE = 'Connection timed out.';
  STOP_CONDITION_MESSAGE = 'Stop condition reached.';
  MAX_RETRIES_MESSAGE = 'Max retries reached, either there is a connection error or you have reached the maximum items you can fetch.';
  MAX_ITEMS_MESSAGE = 'Maximum fetchable items reached.';

  constructor() {
    super();
    this.constants = constants;
    this.constants.once('ready', () => {
      this._initialize();
      this.initialized = true;
    });
    this.constants.on('reset', () => {
      this._initialize();
    });
    if (typeof this.condition === 'undefined') {
      throw new Error(`no condition set for ${this.options.items}`);
    }
    if (typeof this.step === 'undefined') {
      throw new Error(`no step set for ${this.options.items}`);
    }
    this.on('stop', () => {
      console.log('stopped');
    });
    this.on('continue', ::this.run);
    this.name = this.constructor.name;
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
      if (options.retryTimes) {
        this.retryTimes = options.retryTimes;
      }
      if (options.sync) {
        this.sync = options.sync;  // sets flag to run without calling "next()"
      }
    }
    if (this.initialized) {
      return this.run();
    }
    this.constants.once('ready', () => {
      return this.run();
    });
  }

  async fetch() { // TODO: make this accept options so that its usable outside of the start() method
    const deferred = Deferred();
    ajax({
      type: 'GET',
      url: this.options.url,
      timeout: 30000,
      success: data => {
        if (typeof this.parse === 'function') {
          const processedData = this.parse(data);
          deferred.resolve(processedData);
        } else {
          deferred.resolve(data);
        }
      },
      error: e => {
        if (e.statusText === 'timeout') {
          deferred.reject(this.TIMEOUT_MESSAGE);
        } else {
          deferred.reject(e);
        }
      }
    });
    return deferred.promise();
  }

  next() {
    return this.run();
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
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise();
  }

  async run(retry) {
    try {
      if (!this.condition()) { // NOTE: condition represents what must be true for run to crawl
        return this.stop(this.STOP_CONDITION_MESSAGE);
      }
      const items = await this.crawl({
        iterator: this.options.iterator,
        item: this.options.item,
        callback: this.process
      }, retry);
      this.retriedTimes = 0;
      if (typeof this.step === 'function') {
        this.step();
      }
      this.emit('items', items);
      if (items.length === 0) {
        return this.stop(this.MAX_ITEMS_MESSAGE);
      }
    } catch (err) {
      if (this.retriedTimes <= (this.retryTimes - 1)) {
        return this.handleError(err);
      }
      this.emit('error', err);
      return this.stop(this.MAX_RETRIES_MESSAGE);
    }
    if (this.sync) {
      return this.run(retry);
    }
  }

  stop(message) {
    this.emit('done', message);
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

  removeListeners() {
    for (const key in this._events) {
      if ({}.hasOwnProperty.call(this._events, key)) {
        this.removeListener(key, this._events[key].fn, this);
      }
    }
  }
}
