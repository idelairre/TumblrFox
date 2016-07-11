module.exports = (function chromeMixin(Tumblr, Backbone, $, _, Mixin) {

  const { last, snakeCase, omit } = _;

  /**
   * @param {String} eventName The name of the window event corresponding to a chrome action
   * @param {String} payload The data to send to the extension backend
   * @param {String} callback Optional function to perform on response
   */

  const { uniqueId } = _;

  const ChromeMixin = new Mixin({ // NOTE: add cid's to event responses so that they do not clobber one another when multiple rapid events are make
    chromeTrigger(eventName, data, callback) {
      if (!callback && typeof data === 'function') {
        callback = data;
        data = false;
      }
      const payload = {};
      payload._id = uniqueId();
      payload._type = eventName;
      if (data) {
        payload.data = data;
      }
      const req = new CustomEvent('request', {
        detail: payload
      });
      const responseName = `chrome:response:${last(snakeCase(eventName).split('_'))}:${payload._id}`;

      Tumblr.Fox.Events.once(responseName, callback);
      window.dispatchEvent(req);
    }
  });

  Tumblr.Fox.register('ChromeMixin', ChromeMixin);

});
