module.exports = (function componentFetcher() {
  Tumblr.Fox = Tumblr.Fox || {};

  Tumblr.Fox.getComponent = function(args, className) {
    const modules = args[2]['m'];
    let results = [];
    for (let key in modules) {
      if (modules[key].toString().includes(className) && key !== '0') {
        results.push(key);
        console.log('[GET COMPONENT]', className, [key]);
      }
    }
    return results;
  }

  return Tumblr.Fox;
});
