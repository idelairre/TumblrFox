/* global document:true */

import Lunr from 'lunr';
import $ from 'jquery';

const stripScripts = script => {
  const div = document.createElement('div');
  div.innerHTML = script;
  const scripts = div.getElementsByTagName('script');
  let i = scripts.length;
  while (i--) {
    scripts[i].parentNode.removeChild(scripts[i]);
  }
  return div.innerHTML;
};

class LunrSearch {
  constructor() {
    this.lunr = Lunr();
  }

  tokenizeHtml(html) {
    html = stripScripts(html);
    const text = $(html).text();
    return this.tokenize(text);
  }

  tokenize(text) {
    return this.lunr.pipeline.run(Lunr.tokenizer(text));
  }
}

const lunrSearch = new LunrSearch();

export default lunrSearch;
