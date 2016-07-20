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

export const htmlTags = ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'element', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'head', 'header', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'meta', 'meter', 'multicol', 'nav', 'noframes', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'shadow', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr'];

class LunrSearch {
  constructor() {
    this.lunr = Lunr();
  }

  tokenizeHtml(html) { // TODO: strip out html data
    html = stripScripts(html);
    const text = $(html).text();
    let tokens = this.tokenize(text).filter(token => {
      if (htmlTags.includes(token) || token.includes('#')) { // its probably a tag, this will be included anyways
        return;
      }
      return token;
    })
    tokens = tokens.filter((item, pos) => {
      return tokens.indexOf(item) == pos;
    });
    return tokens;
  }

  tokenize(text) {
    return this.lunr.pipeline.run(Lunr.tokenizer(text));
  }
}

const lunrSearch = new LunrSearch();

export default lunrSearch;
