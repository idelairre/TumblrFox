import { ajax, Deferred } from 'jquery';
import EventEmitter from 'eventemitter3';
import constants from '../constants';
import { isArray, isElement, isEmpty, omit, noop, pick } from 'lodash';
import { debug } from '../services/loggingService';

export default class Source extends EventEmitter { // TODO: refactor this into an event emitter than can be interrupted
  options = {
    page: 0,
    iterator: null,
    item: null,
    url: null,
    until: null
  };
  initialized = false;
  stopFlag = false;
  sync = false;
  retryTimes = 3;
  retriedTimes = 0;
  STOP_FLAG_MESSAGE = 'Stop flag detected.';
  TIMEOUT_MESSAGE = 'Connection timed out.';
  STOP_CONDITION_MESSAGE = 'Stop condition reached.';
  EMPTY_RESPONSE_MESSAGE = 'Response was empty.';
  MAX_RETRIES_MESSAGE = 'Max retries reached, either there is a connection error or you have reached the maximum items you can fetch.';
  MAX_ITEMS_MESSAGE = 'Maximum fetchable items reached.';

  constructor(...args) {
    super();
    Object.assign(this.options, pick(...args, Object.keys(this.options)));
    Object.assign(this, pick(...args, ['condition', 'parse', 'step', 'sync']));

    this.constants = constants;
    if (!this.constants.initialized) {
      this.constants.once('ready', ::this._initialize);
    } else {
      this._initialize();
    }
    this.constants.on('reset', ::this._initialize);
    this.on('continue', ::this.run);
    this.on('done', () => {
      this.stopFlag = false;
    });
    this.name = this.constructor.name;
  }

  _initialize() {
    if (this.options) {
      this.defaults = Object.assign({}, this.options);
    }
    if (typeof this.initializeConstants === 'function') {
      this.initializeConstants();
    }
    if (typeof this.condition === 'undefined') {
      throw new Error(`no condition set for ${this.options.item}`);
    }
    if (typeof this.parse === 'undefined') {
      console.warn('no parse function defined');
    }
    if (typeof this.step === 'undefined') {
      throw new Error(`no step set for ${this.options.item}`);
    }
    this.emit('initialized');
    this.initialized = true;
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
      timeout: 300000,
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
      if (isElement(items)) {
        debug(`✔ Crawled ${this.options.item} from ${opts.iterator}: ${this.options[opts.iterator]}`);
      } else if (isArray(items)) {
        debug(`✔ Crawled ${items.length} ${this.options.item} from ${opts.iterator}: ${this.options[opts.iterator]}`);
      }
      deferred.resolve(items);
    } catch (err) {
      deferred.reject(err);
    }
    return deferred.promise();
  }

  async run(retry) {
    try {
      if (this.stopFlag) {
        return this.done(this.STOP_FLAG_MESSAGE);
      }
      if (!this.condition()) { // NOTE: condition represents what must be true for run to crawl
        return this.done(this.STOP_CONDITION_MESSAGE);
      }
      const items = await this.crawl({
        iterator: this.options.iterator,
        item: this.options.item
      }, retry);
      this.retriedTimes = 0;
      if (typeof this.step === 'function') {
        this.step();
      }
      this.emit('items', items);
      if (isArray(items) && items.length === 0) {
        return this.done(this.MAX_ITEMS_MESSAGE);
      } else if (isEmpty(items)) {
        return this.done(this.EMPTY_RESPONSE_MESSAGE);
      }
    } catch (err) {
      if (this.retriedTimes <= (this.retryTimes - 1)) {
        return this.handleError(err);
      }
      this.emit('error', err);
      return this.done(this.MAX_RETRIES_MESSAGE);
    }
    if (this.sync && !this.stopFlag) {
      return this.run(retry);
    } else if (this.stopFlag) {
      return this.done(this.STOP_FLAG_MESSAGE);
    }
    this.emit('next'); // flags when the next run should be called for tests
  }

  stop() {
    this.emit('stop');
    this.stopFlag = true;
  }

  done(message) {
    this.emit('done', message ? message : null);
    this.removeListeners();
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
    super.removeAllListeners();
  }
}
