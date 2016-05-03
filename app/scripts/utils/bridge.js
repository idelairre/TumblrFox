module.exports = {
  initialize() {
    this.bindEvents();

    window.addEventListener('chrome:fetch:tags', () => {
      this.fetchLikeTags(tags => {
        this.trigger('chrome:response:tags', tags);
      });
    });
  },
  camelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
      if (+match === 0) {
        return '';
      } // or if (/\s+/.test(match)) for white spaces
      return index == 0 ? match.toLowerCase() : match.toUpperCase();
    });
  },
  listenTo(eventName, callback) {
    let eventSlug = this.camelCase(eventName.split(':').splice(1).join(' '));
    window.addEventListener(eventName, e => {
      let req = {};
      req.payload = e.detail;
      req.type = eventSlug;
      chrome.runtime.sendMessage(req, response => {
        return callback(response);
      });
    });
  },
  trigger(eventName, payload) {
    let req;
    if (payload) {
      req = new CustomEvent(eventName, {
        detail: payload
      });
    } else {
      req = new Event(eventName);
    }
    window.dispatchEvent(req);
  },
  bindEvents() {
    this.listenTo('chrome:fetch:posts', posts => {
      this.trigger('chrome:response:posts', posts);
    });
    this.listenTo('chrome:fetch:blogPosts', posts => {
      this.trigger('chrome:response:posts', posts);
    });
    // TODO: make this cache posts
    this.listenTo('chrome:fetch:likes', posts => {
      this.trigger('chrome:response:posts', posts);
    });
    this.listenTo('chrome:search:likes', likedPosts => {
      this.trigger('chrome:response:likes', likedPosts);
    });
  },
  fetchLikeTags(callback) {
    chrome.storage.local.get({ tags: [] }, items => {
      callback(items.tags);
    });
  }
}
