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

export default stripScripts;
