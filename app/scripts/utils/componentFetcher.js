module.exports = (function componentFetcher() {
  Tumblr.Fox = Tumblr.Fox || {};

  Tumblr.Fox.getComponent = function(args, object, searchTerm) {
    const modules = args[2]['m'];
    if (typeof searchTerm === 'undefined') {
      searchTerm = object;
    }
    let results = [];
    for (let key in modules) {
      if (modules[key].toString().includes(searchTerm) && key !== '0') {
        results.push(key);
      }
    }
    console.log('[GET COMPONENT]', object, results);
    return results;
  }

  return Tumblr.Fox;
});
