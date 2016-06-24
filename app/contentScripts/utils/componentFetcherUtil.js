/* global window:true */

module.exports = (function componentFetcher(Tumblr, Backbone, _) {
  const { extend, forIn, isArray } = _;

  window.webpackJsonp(0, [function (module, exports, require) {
    window.webpackModules = Array.prototype.slice.call(arguments);
    window.require = require;
    Tumblr.Fox.require = require;
  }]);

  // perhaps there is a way to memoize fetched component numbers?

  const ComponentFetcher = function () {
    this.$$componentCache = {};
    Tumblr.Fox.trigger('fox:components:fetcherInitialized', this);
  };

  extend(ComponentFetcher.prototype, Tumblr.Events, Backbone.Events);

  extend(ComponentFetcher.prototype, {
    getComponent(object, searchTerm) {
      const modules = window.webpackModules[2].m;
      let putFlag = true;
      if (typeof searchTerm === 'undefined') {
        searchTerm = object;
        putFlag = false;
      }
      const results = [];
      for (const key in modules) {
        if (modules[key].toString().includes(searchTerm) && key !== '0') {
          results.push(key);
        }
      }
      if (results.length === 1 && putFlag) {
        this.put(object, Tumblr.Fox.require(results[0]));
      }
      if (results.length === 0) {
        console.error('[GET COMPONENT FAILED]', object);
      }
      // if (Tumblr.Fox.options.get('logging')) {
        console.log('[GET COMPONENT]', object, results);
      // }
      return results;
    },
    getComponents(manifest) {
      forIn(manifest, (value, key) => {
        this.getComponent(key, value);
      });
    },
    get(componentName) {
      if (typeof this.$$componentCache[componentName] === 'undefined') {
        throw new Error(`Component "${componentName}" not found or not yet loaded`);
      }
      return this.$$componentCache[componentName];
    },
    getAll(componentArray) {
      if (!isArray(componentArray)) {
        componentArray = Array.prototype.slice.call(arguments);
      }
      const response = {};
      componentArray.map(component => {
        if (typeof this.$$componentCache[component] === 'undefined') {
          throw new Error(`Component "${component}" in "${componentArray}" not found or not yet loaded`);
        } else {
          response[component] = this.$$componentCache[component];
        }
      });
      return response;
    },
    put(name, component) {
      this.$$componentCache[name] = component;
      Tumblr.Fox.trigger('fox:components:add', name, this.$$componentCache[name]);
    }
  });

  Tumblr.Fox.Utils.ComponentFetcher = new ComponentFetcher();
});
