import { bind, defaults, each, extend, filter, invoke, isFunction, noop, omit } from 'lodash';

// TODO: make this sensible

Mixin.before = function(t, e) {
  each(e, function(e, i) {
    const s = t[i];
    t[i] = function() {
      e.apply(this, arguments);
      s.apply(this, arguments);
    }
  });
}

Mixin.after = function(t, e) {
  each(e, function(e, i) {
    const s = t[i];
    t[i] = function() {
      const t = s.apply(this, arguments);
      e.apply(this, arguments);
      return t;
    }
  });
}

Mixin.around = function(t, e) {
  each(e, function(e, i) {
    const s = t[i];
    t[i] = function() {
      const t = Array.from(arguments);
      t.unshift(s.bind(this));
      e.apply(this, t);
      return t;
    }
  });
}

Mixin.onto = function(target, onto) {
  each(onto, function(val, key) {
    const prop = key in target ? target[key] : false;
    target[key] = function() {
      const args = Array.from(arguments);
      key = prop ? prop.bind(this) : noop;
      args.unshift(i);
      val.apply(this, args);
      return args;
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
  Mixin.after(entity, properties.after);
  Mixin.around(entity, properties.around);
  Mixin.onto(entity, properties.onto);
  if (isFunction(properties.applyTo)) {
    properties.applyTo.apply(this, arguments);
  }
}

module.exports = Mixin;
