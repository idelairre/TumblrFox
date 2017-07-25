import { Deferred } from 'jquery';
import browser from '../background/lib/browserPolyfill';

const Inject = filePaths => {
  return Deferred(({ resolve, reject }) => {
    let done = 0;
    let resolved = false;
    for (const file in filePaths) {
      try {
        const module = document.createElement('script');
        const src = browser.extension.getURL(filePaths[file]);
        module.type = 'text/javascript';
        module.src = src;
        document.body.appendChild(module);
        module.onload = function() {
          done += 1;
          if (!resolved && done === filePaths.length) {
            resolved = true;
            resolve();
          }
          // this.remove();
        };
      } catch (err) {
        reject(err);
      }
    }
  });
}

export default Inject;
