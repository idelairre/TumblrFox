module.exports = (function object(Object) {
  Object.defineProperty(Object.prototype, 'renameProperty', {
    writable: false,
    enumerable: false,
    configurable: false,
    value(oldName, newName) {
      if (oldName === newName) {
        return this;
      }
      if (this.hasOwnProperty(oldName)) {
        this[newName] = this[oldName];
        delete this[oldName];
      }
      return this;
    }
  });

  const promiseSeries = promises => {
    const p = $.Deferred().resolve();
    return promises.reduce((pacc, fn, index) => {
      return pacc = pacc.always(fn);
    }, p);
  }
})(window.Object);
