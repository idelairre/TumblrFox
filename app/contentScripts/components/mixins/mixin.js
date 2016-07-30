import { bind, defaults, each, extend, filter, invoke, isFunction, noop, omit, toArray } from 'lodash';

// TODO: make this sensible

function before(t, e) {
  each(e, function(e, i) {
    const s = t[i];
    t[i] = function() {
      e.apply(this, arguments);
      s.apply(this, arguments);
    }
  });
}

function after(t, e) {
  each(e, function(e, i) {
    const s = t[i];
    t[i] = function() {
      const t = s.apply(this, arguments);
      e.apply(this, arguments);
      return t;
    }
  });
}

function around(t, e) {
  each(e, function(e, i) {
    const s = t[i];
    t[i] = function() {
      const t = toArray(arguments);
      t.unshift(bind(s, this));
      e.apply(this, t);
      return t;
    }
  });
}

function onto(t, e) {
  each(e, function(e, i) {
    const s = i in t ? t[i] : false;
    t[i] = function() {
      const t = toArray(arguments);
      i = s ? bind(s, this) : noop;
      t.unshift(i);
      e.apply(this, t);
      return t;
    }
  });
}

function mixinDefaults(target, source) {
  defaults(target, source);
}

function mixinExtend(target, source) {
  extend(target, source);
}

function Mixin() {
  this.mixins = filter(arguments, function(mixin) {
    return mixin instanceof Mixin;
  });
  this.properties = arguments[this.mixins.length] || {};
}

Mixin.prototype.mixins = null;
Mixin.prototype.properties = null;
Mixin.prototype.applyTo = function(entity) {
  const properties = this.properties;
  mixinDefaults(entity, properties.defaults);
  mixinExtend(entity, properties.extend);
  extend(entity, omit(properties, 'before', 'after', 'around', 'onto', 'defaults', 'extend', 'applyTo'));
  invoke(this.mixins, 'applyTo', entity);
  mixinExtend(entity, properties.before);
  after(entity, properties.after);
  around(entity, properties.around);
  onto(entity, properties.onto);
  isFunction(properties.applyTo) && properties.applyTo.apply(this, arguments);
}
Mixin.before = before;
Mixin.after = after;
Mixin.around = around;
Mixin.onto = onto;

module.exports = Mixin;
