import { defaults, extend } from 'lodash';

const LOCAL_STORAGE_KEY = 'IdleMonitor.actionTime';

function IdleMonitor(options) {
  this.timeout = null;
  this.lastAction = null;
  this.warningFired = false;
  this.defaults = {
    checkIntervalSecs: 10,
    events: {
      'document': 'click keyup'
    },
    warningSecs: 60 * 14,
    timeoutSecs: 60 * 15
  };

  this.options = Object.assign({}, this.defaults, options);

  // Apply action callbacks
  Object.keys(this.options.events).forEach(selector => {
    const element = (selector === 'document' ? document : selector);
    $(element).on(this.options.events[selector], this.actionCallback.bind(this));
  });
}

extend(IdleMonitor.prototype, Backbone.Events, {
  actionCallback() {
    localStorage.setItem(LOCAL_STORAGE_KEY, (new Date()).getTime());
    this.trigger('action');
  },
  checkCallback() {
    const lastActionUnixTime = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY), 10);
    const timeDiff = ((new Date()).getTime() - (new Date(lastActionUnixTime)).getTime()) / 1000;

    // Store the last time an action happened
    if (this.lastAction && this.lastAction !== lastActionUnixTime) {
      this.trigger('action');
      this.warningFired = false;
      this.lastAction = lastActionUnixTime;
      return;
    }
    this.lastAction = lastActionUnixTime;

    // Fire warning
    if (!this.warningFired && timeDiff >= this.options.warningSecs) {
      this.trigger('warn');
      this.warningFired = true;
    }

    // Fire timeout
    if (timeDiff >= this.options.timeoutSecs) {
      this.trigger('timeout');
    }
  },
  start(options) {
    if (options) {
      this.options = Object.assign({}, this.defaults, options);
    }
    this.stop();
    this.actionCallback();
    this.timeout = setInterval(this.checkCallback.bind(this), this.options.checkIntervalSecs * 1000);
  },
  stop() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    this.warningFired = false;
  }
});

module.exports = IdleMonitor;
