module.exports = (function componentFetcher(Tumblr, Backbone, _) {
  const { camelCase, extend, forIn, isArray } = _;

  // perhaps there is a way to memoize fetched component numbers?

  const ComponentFetcher = function () {
    this.$$componentCache = {};
    this.modules = window.webpackModules[2].m;
    this.componentIds = {};
    this.initialize.apply(this);
  };

  extend(ComponentFetcher.prototype, Backbone.Events, {
    initialize() {
      Tumblr.Fox.trigger('initialize:componentFetcher', this);
    },
    getComponent(object, searchTerm) {
      let putFlag = true;
      if (typeof searchTerm === 'undefined') {
        searchTerm = object;
        putFlag = false;
      }
      const results = [];
      for (const key in this.modules) {
        if (this.modules[key].toString().includes(searchTerm) && key !== '0') {
          results.push(key);
        }
      }
      if (results.length === 1 && putFlag) {
        this.put(object, Tumblr.Fox.require(results[0]));
        this.componentIds[object] = results[0];
      }
      if (results.length === 0) {
        console.error('[FETCHING COMPONENT FAILED]', object);
      }
      // if (Tumblr.Fox.options.get('logging')) {
        // console.log('[FETCHING COMPONENT]', object, results);
      // }
      return results;
    },
    getComponents(manifest) {
      forIn(manifest, (value, key) => {
        this.getComponent(key, value);
      });
      Tumblr.Fox.trigger('initialize:components:done');
    },
    getId(name) {
      if (this.componentIds[name]) {
        return this.componentIds[name];
      } else {
        throw new Error(`Component "${name}" not found`);
      }
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
      Tumblr.Fox.trigger('initialize:components:add', name, this.$$componentCache[name]);
    }
  });

  Tumblr.Fox.Utils.ComponentFetcher = new ComponentFetcher();

});
