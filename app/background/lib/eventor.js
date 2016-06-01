export default class Eventor {
  addListener(event, fct) {
    this._events = this._events || {};
    this._events[event] = this._events[event]	|| [];
    this._events[event].push(fct);
  }

  removeListener(event, fct) {
    this._events = this._events || {};
    if (event in this._events === false) {
      return;
    }
    this._events[event].splice(this._events[event].indexOf(fct), 1);
  }

  trigger(event /* , args... */) {
    this._events = this._events || {};
    if (event in this._events === false) {
      return;
    }
    for (let i = 0; i < this._events[event].length; i += 1) {
      this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
}
