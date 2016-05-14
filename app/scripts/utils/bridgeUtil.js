module.exports = {
  initialize() {
    this.bindEvents();
  },
  camelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (Number(match) === 0) {
        return '';
      } // or if (/\s+/.test(match)) for white spaces
      return index === 0 ? match.toLowerCase() : match.toUpperCase();
    });
  },
  listenTo(eventName, callback) {
    console.log('[BRIDGE LISTEN]', eventName);
    const eventSlug = this.camelCase(eventName.split(':').splice(1).join(' '));
    window.addEventListener(eventName, e => {
      const req = {};
      if (e.detail) {
        req.payload = e.detail;
      }
      req.type = eventSlug;
      chrome.runtime.sendMessage(req, response => {
        return callback ? callback(response) : null;
      });
    });
  },
  trigger(eventName, payload) {
    let req = {};
    if (typeof payload !== 'undefined') {
      req = new CustomEvent(eventName, {
        detail: payload
      });
    } else {
      req = new Event(eventName);
    }
    window.dispatchEvent(req);
  },
  bindEvents() {
    // NOTE: maybe wrap the callback in the trigger and automatically create and remove the listener?
    // this way the api will resemble a normal request
    this.listenTo('chrome:fetch:posts', response => {
      this.trigger('chrome:response:posts', response);
    });
    this.listenTo('chrome:fetch:blogPosts', response => {
      this.trigger('chrome:response:posts', response);
    });
    this.listenTo('chrome:fetch:likes', response => {
      this.trigger('chrome:response:posts', response);
    });
    this.listenTo('chrome:search:likes', response => {
      this.trigger('chrome:response:likes', response);
    });
    this.listenTo('chrome:fetch:following', response => {
      this.trigger('chrome:response:following', response);
    });
    this.listenTo('chrome:fetch:tags', response => {
      this.trigger('chrome:response:tags', response);
    });
    this.listenTo('chrome:fetch:constants', response => {
      this.trigger('chrome:response:constants', response);
    });
    this.listenTo('chrome:update:following');
    this.listenTo('chrome:update:likes');
    this.listenTo('chrome:sendData');
  }
};
