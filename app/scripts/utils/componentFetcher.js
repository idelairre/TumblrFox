module.exports = (function componentFetcher() {
  Tumblr.Fox = Tumblr.Fox || {};

  Tumblr.Fox.getComponent = function(args, object, searchTerm) {
    const modules = args[2]['m'];
    let putFlag = true;
    if (typeof searchTerm === 'undefined') {
      searchTerm = object;
      putFlag = false;
    }
    let results = [];
    for (let key in modules) {
      if (modules[key].toString().includes(searchTerm) && key !== '0') {
        results.push(key);
      }
    }
    if (results.length === 1 && putFlag) {
      Tumblr.Fox.put(object, Tumblr.Fox.require(results[0]));
    }
    console.log('[GET COMPONENT]', object, results);
    return results;
  }

  Tumblr.Fox.$$componentCache = {};

  Tumblr.Fox.get = function(componentName) {
    return Tumblr.Fox.$$componentCache[componentName];
  }

  Tumblr.Fox.put = function(name, component) {
    Tumblr.Fox.$$componentCache[name] = component;
  }

  return Tumblr;
});
