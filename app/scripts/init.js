module.exports = (function init(Tumblr, Backbone, _) {
  Tumblr.Fox = Tumblr.Fox || {};

  const req = new CustomEvent('chrome:sendData', { detail: {
    currentUser: Tumblr.Prima.currentUser().id
  }});
  window.dispatchEvent(req);
  
  return Tumblr.Fox;
});
