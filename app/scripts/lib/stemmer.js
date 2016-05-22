export const stopwords = ['a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves'];

export const htmlTags = ["a","abbr","address","area","article","aside","audio","b","base","bdi","bdo","blockquote","body","br","button","canvas","caption","cite","code","col","colgroup","data","datalist","dd","del","details","dfn","div","dl","dt","element","em","embed","fieldset","figcaption","figure","footer","form","head","header","hr","html","i","iframe","img","input","ins","kbd","label","legend","li","link","main","map","mark","meta","meter","multicol","nav","noframes","noscript","object","ol","optgroup","option","output","p","param","pre","progress","q","rp","rt","rtc","ruby","s","samp","script","section","select","shadow","small","source","span","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","title","tr","track","u","ul","var","video","wbr"];

export const htmlAttributes = ["accept","form","input","acceptcharset","form","accesskey","action","form","align","applet","caption","col","colgroup","hr","iframe","img","table","tbody","td","tfoot","th","thead","tr","alt","applet","area","img","input","async","script","autocomplete","form","input","autofocus","button","input","keygen","select","textarea","autoplay","audio","video","autosave","input","bgcolor","body","col","colgroup","marquee","table","tbody","tfoot","td","th","tr","backgroundcolor","border","img","object","table","border","buffered","audio","video","challenge","keygen","charset","meta","script","checked","command","input","cite","blockquote","del","ins","q","class","code","applet","codebase","applet","color","basefont","font","hr","color","cols","textarea","colspan","td","th","content","meta","httpequiv","name","contenteditable","contextmenu","menu","controls","audio","video","coords","area","data","object","data","datetime","del","ins","time","default","track","defer","script","dir","dirname","input","textarea","disabled","button","command","fieldset","input","keygen","optgroup","option","select","textarea","download","a","area","draggable","dropzone","enctype","form","method","for","label","output","form","button","fieldset","input","keygen","label","meter","object","output","progress","select","textarea","formaction","input","button","form","headers","td","th","th","height","canvas","embed","iframe","img","input","object","video","height","div","height","hidden","high","meter","href","a","area","base","link","hreflang","a","area","link","httpequiv","meta","icon","command","id","ismap","img","itemprop","keytype","keygen","kind","track","label","track","lang","language","script","list","input","loop","audio","bgsound","marquee","video","low","meter","manifest","html","max","input","meter","progress","maxlength","input","textarea","media","a","area","link","source","style","method","form","GET","POST","min","input","meter","multiple","input","select","email","file","muted","video","name","button","form","fieldset","iframe","input","keygen","object","output","select","textarea","map","meta","param","novalidate","form","open","details","optimum","meter","pattern","input","ping","a","area","placeholder","input","textarea","poster","video","preload","audio","video","radiogroup","command","readonly","input","textarea","rel","a","area","link","required","input","select","textarea","reversed","ol","rows","textarea","rowspan","td","th","sandbox","iframe","scope","th","scoped","style","seamless","iframe","selected","option","shape","a","area","size","input","select","type","text","password","sizes","link","img","source","span","col","colgroup","spellcheck","src","audio","embed","iframe","img","input","script","source","track","video","srcdoc","iframe","srclang","track","srcset","img","start","ol","step","input","style","summary","table","tabindex","target","a","area","base","form","title","type","button","input","command","embed","object","script","source","style","menu","usemap","img","input","object","value","button","option","input","li","meter","progress","param","width","canvas","embed","iframe","img","input","object","video","div","width","wrap","textarea","elementsetAttribute","elementgetAttribute","input","maxlength","setAttributemaxlength 42","elementfoo","type","input","inputtypefoobar","input","type","inputmaxlength","inputmaxlength","inputmaxlength","selectsize"];

export const stemmer = (() => {
  const step2list = {
    ational: 'ate',
    tional: 'tion',
    enci: 'ence',
    anci: 'ance',
    izer: 'ize',
    bli: 'ble',
    alli: 'al',
    entli: 'ent',
    eli: 'e',
    ousli: 'ous',
    ization: 'ize',
    ation: 'ate',
    ator: 'ate',
    alism: 'al',
    iveness: 'ive',
    fulness: 'ful',
    ousness: 'ous',
    aliti: 'al',
    iviti: 'ive',
    biliti: 'ble',
    logi: 'log'
  };

  const step3list = {
    icate: 'ic',
    ative: '',
    alize: 'al',
    iciti: 'ic',
    ical: 'ic',
    ful: '',
    ness: ''
  };

  const c = '[^aeiou]'; // consonant
  const v = '[aeiouy]'; // vowel
  const C = `${c}[^aeiouy]*`; // consonant sequence
  const V = `${v}[aeiou]*`; // vowel sequence

  const mgr0 = `^(${C})?${V}${C}`; // [C]VC... is m>0
  const meq1 = `^(${C})?${V}${C}(${V})?$`; // [C]VC[V] is m=1
  const mgr1 = `^(${C})?${V}${C}${V}${C};`; // [C]VCVC... is m>1
  const sV = `^(${C})?${v}`; // vowel in stem

  return function (w) {
    let stem = w;
    let suffix = w;
    let firstch = w;
    let re = w;
    let re2 = w;
    let re3 = w;
    let re4 = w;

    if (w.length < 3) {
      return w;
    }
    firstch = w.substr(0, 1);
    if (firstch === 'y') {
      w = firstch.toUpperCase() + w.substr(1);
    }

    // Step 1a
    re = /^(.+?)(ss|i)es$/;
    re2 = /^(.+?)([^s])s$/;

    if (re.test(w)) {
      w = w.replace(re, '$1$2');
    } else if (re2.test(w)) {
      w = w.replace(re2, '$1$2');
    }

    // Step 1b
    re = /^(.+?)eed$/;
    re2 = /^(.+?)(ed|ing)$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      re = new RegExp(mgr0);
      if (re.test(fp[1])) {
        re = /.$/;
        w = w.replace(re, '');
      }
    } else if (re2.test(w)) {
      const fp = re2.exec(w);
      stem = fp[1];
      re2 = new RegExp(sV);
      if (re2.test(stem)) {
        w = stem;
        re2 = /(at|bl|iz)$/;
        re3 = new RegExp('([^aeiouylsz])\\1$');
        re4 = new RegExp(`^${C}${v}[^aeiouwxy]$`);
        if (re2.test(w)) {
          w += 'e';
        } else if (re3.test(w)) {
          re = /.$/;
          w = w.replace(re, '');
        } else if (re4.test(w)) {
          w += 'e';
        }
      }
    }

    // Step 1c
    re = /^(.+?)y$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(sV);
      if (re.test(stem)) {
        w = `${stem}i`;
      }
    }

    // Step 2
    re = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) {
        w = stem + step2list[suffix];
      }
    }

    // Step 3
    re = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      suffix = fp[2];
      re = new RegExp(mgr0);
      if (re.test(stem)) {
        w = stem + step3list[suffix];
      }
    }

    // Step 4
    re = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/;
    re2 = /^(.+?)(s|t)(ion)$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      if (re.test(stem)) {
        w = stem;
      }
    } else if (re2.test(w)) {
      const fp = re2.exec(w);
      stem = fp[1] + fp[2];
      re2 = new RegExp(mgr1);
      if (re2.test(stem)) {
        w = stem;
      }
    }

    // Step 5
    re = /^(.+?)e$/;
    if (re.test(w)) {
      const fp = re.exec(w);
      stem = fp[1];
      re = new RegExp(mgr1);
      re2 = new RegExp(meq1);
      re3 = new RegExp(`^${C}${v}[^aeiouwxy]$`);
      if (re.test(stem) || (re2.test(stem) && !(re3.test(stem)))) {
        w = stem;
      }
    }

    re = /ll$/;
    re2 = new RegExp(mgr1);
    if (re.test(w) && re2.test(w)) {
      re = /.$/;
      w = w.replace(re, '');
    }
    // and turn initial Y back to y
    if (firstch === 'y') {
      w = firstch.toLowerCase() + w.substr(1);
    }
    return w;
  };
})();
