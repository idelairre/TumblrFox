module.exports = (function chromeTriggerMixin(Tumblr, Backbone, _) {
  const $ = Backbone.$;
  const { get } = Tumblr.Fox;
  const Mixin = get('Mixin');

  /**
   * @param {String} eventName The name of the window event corresponding to a chrome action
   * @param {String} payload The data to send to the extension backend
   * @param {String} callback Optional function to perform on response
   */

  const chromeMixin = new Mixin({
    chromeTrigger(eventName, payload, callback) {
      console.log('[CHROME TRIGGER]', arguments);
      let req = {};
      if (!payload) {
        req = new Event(eventName);
      } else if (!callback && typeof payload === 'function') {
        callback = payload;
        req = new Event(eventName);
      } else {
        req = new CustomEvent(eventName, { detail: payload });
      }
      let responseEvent = eventName.split(':');
      responseEvent[1] = 'response';
      responseEvent = responseEvent.join(':');
      const onFinish = ((response) => {
        callback ? callback(response.detail) : null;
        setTimeout(() => {
          window.removeEventListener(responseEvent, onFinish);
        }, 1);
      });
      window.dispatchEvent(req);
      window.addEventListener(responseEvent, onFinish);
    }
  });

  Tumblr.Fox.chromeMixin = chromeMixin;

  return Tumblr.Fox.chromeMixin;
});
