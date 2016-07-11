module.exports = (function b64Util() {

  const { Utils } = Tumblr.Fox;

  const encodeUnicode = str => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode('0x' + p1);
    }));
  }

  const decodeUnicode = str => {
    return decodeURIComponent(Array.prototype.map.call(atob(str), c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
  }

  Utils.B64 = {
    encodeUnicode,
    decodeUnicode
  };
});
