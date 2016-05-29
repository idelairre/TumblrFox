import clarinet from 'clarinet';
import { isArray, isObject } from 'lodash';
import db from '../lib/db';

export default class Parser {
  arraySchemas = {};
  test = {};
  item = {};
  lastKey = null;
  lastValue = null;
  lastDepth = null;
  depth = 0; // we have to go deeper

  constructor(schema) {
    this.setSchema(schema);
    this.parser = clarinet.parser();
    this.parser.onerror = ::this.onError;
    this.parser.onvalue = ::this.onValue;
    this.parser.onopenobject = ::this.onOpenObject;
    this.parser.onkey = ::this.onKey;
    this.parser.oncloseobject = ::this.onCloseObject;
    this.parser.onopenarray = ::this.onOpenArray;
    this.parser.onclosearray = ::this.onCloseArray;
    this.parser.onend = ::this.onEnd;
    this.addListener('ready', () => {
      // console.log(this.schema);
      console.log(this.arraySchemas);
    });
    return this.parser;
  }

  setSchema(database) {
    this.schema = {};
    db[database].toCollection().toArray().then(items => {
      items.length = 1;
      this.test = items[0];
      items.map(item => {
        this.schema = this.defineSchema(item);
      });
      this.trigger('ready');
    });
  }

  defineSchema(item) {
    // console.log(item);
    if (item === null) {
      return item;
    }
    const schema = {};
    const keys = Object.keys(item);
    keys.map(key => {
      if (!schema.hasOwnProperty(key)) {
        const type = typeof item[key];
        if (isArray(item[key])) {
          schema[key] = 'array';
          if (isObject(item[key][0])) {
            this.arraySchemas = this.arraySchemas || {};
            this.arraySchemas[key] = this.defineSchema(item[key][0]);
          }
        } else if (!isArray(item[key]) && typeof item[key] === 'object') {
          schema[key] = this.defineSchema(item[key]);
        } else {
          schema[key] = type;
        }
      }
    });
    return schema;
  }

  checkSchema(testKey, object) {
    for (const key in object) {
      if (!object.hasOwnProperty(testKey)) {
        this.checkSchema(object[key]);
      } else {
        return key;
      }
    }
  }

  validateArrayObject(object, key) {
    if (Object.keys(this.arraySchemas(key)) === Object.keys(object)) {
      return true;
    }
    return false;
  }

  onError(e) {
    console.error(e);
  }

  onWriteError(e) {
    console.error(e);
  }

  onValue(value) {
    if (isArray(this.item[this.lastKey])) {
      console.log('[LAST KEY]', this.lastKey, value);
      if (isObject(value)) {
        console.log('obj val', value);
        console.log(this.validateArrayObject(value, this.lastKey));
      } else {
        this.item[this.lastKey].push(value);
      }
    } else {
      if (typeof value === typeof this.schema[this.lastKey]) {
        this.item[this.lastKey] = value;
      }
    }
  }

  onKey(testKey) {
    if (this.schema.hasOwnProperty(testKey)) {
      this.lastKey = testKey;
      if (isObject(this.schema[testKey])) {
        this.item[testKey] = {};
        const keys = Object.keys(this.schema[testKey]);
        keys.map(schemaKey => { // this is gonna have to get more crazy
          this.item[testKey][schemaKey] = null;
        });
      } else {
        this.item[testKey] = null;
      }
    } else {
      // its in a nested object or an array
      this.assignOrphanKey(testKey);
    }
  }

  assignOrphanKey(testKey) {
    const keys = Object.keys(this.arraySchemas);
    keys.map(schemaKey => { // iterate through schema
      for (const key in this.arraySchemas[schemaKey]) {
        console.log('[ITEM]', this.arraySchemas[schemaKey]); // flag that all future keys and values will be reconstructing the object in the found schema
        if (this.item[key] !== null && this.item.hasOwnProperty(testKey)) {
          this.item[key][testKey] = null;
        }
      }
    });
  }

  onOpenObject(key) { // first key
    console.log('[DEPTH]', this.depth);
    this.lastDepth = this.depth;
    this.depth += 1;
    if (this.schema.hasOwnProperty(key)) {
      this.lastKey = key;
      this.item[key] = null;
    }
  }

  onCloseObject() {
    console.log('[DEPTH]', this.depth);
    this.depth -= 1;
  }

  onOpenArray() {
    console.log('opened an array', this.lastKey);
    if (this.lastKey === null) {
      this.collection = [];
    } else if (this.collection) { // check array schema
      if (this.schema[this.lastKey] === 'array') {
        if (this.arraySchemas[this.lastKey]) {
          console.log('[SPECIAL ARRAY]');
        } else {
        this.item[this.lastKey] = [];
        }
      }
      return;
    }
  }

  onCloseArray() {
    console.log('on closed an array');
  }

  onEnd() {
    console.log('[TEST]', this.test);
    console.log('[RECONSTRUCTED]', this.item);
    console.log(this.schema, this.arraySchemas);
    console.log('end');
  }

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

  trigger(event) {
    this._events = this._events || {};
    if (event in this._events === false) {
      return;
    }
    for (let i = 0; i < this._events[event].length; i += 1) {
      this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }
}
