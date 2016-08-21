import $ from 'jquery';

export const Inject = filePaths => {
  const deferred = $.Deferred();
  let done = 0;
  let resolved = false;
  for (const file in filePaths) {
    const module = document.createElement('script');
    module.type = 'text/javascript';
    module.src = chrome.extension.getURL(filePaths[file]);
    document.body.appendChild(module);
    module.onload = function() {
      done += 1;
      if (!resolved && done === filePaths.length) {
        resolved = true;
        deferred.resolve();
      }
      // this.remove();
    };
  }
  return deferred.promise();
}
