import { has } from 'lodash';

module.exports = (function object(Object) {
  Object.defineProperty(Object.prototype, 'renameProperty', {
    writable: false,
    enumerable: false,
    configurable: false,
    value(oldName, newName) {
      if (oldName === newName) {
        return this;
      }
      if (has(this, oldName)) {
        this[newName] = this[oldName];
        delete this[oldName];
      }
      return this;
    }
  });
})(window.Object);
