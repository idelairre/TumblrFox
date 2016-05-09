module.exports = (function time() {
  Tumblr.Fox = Tumblr.Fox || {};

  Tumblr.Fox.toTumblrTime = function(date) {
    return Date.parse(date) / 1000;
  }

  Tumblr.Fox.fromTumblrTime = function(dateValue) {
    return new Date(dateValue * 1000);
  }

  Tumblr.Fox.decrementTumblrDay = function(date) {
    return toTumblrTime(fromTumblrTime(date).subtractDays(1));
  }

  Tumblr.Fox.prettyDate = function(date) {
    let diff = (((new Date()).getTime() - date.getTime()) / 1000);
    let dayDiff = Math.floor(diff / 86400);

    if (isNaN(dayDiff) || dayDiff < 0 || dayDiff >= 31) {
      return date.toString().split(' ').slice(0, 4).join(' ');
    }

    return dayDiff == 0 && (
        diff < 60 && 'just now' ||
        diff < 120 && '1 minute ago' ||
        diff < 3600 && Math.floor(diff / 60) + ' minutes ago' ||
        diff < 7200 && '1 hour ago' ||
        diff < 86400 && Math.floor(diff / 3600) + ' hours ago') ||
      dayDiff == 1 && 'Yesterday' ||
      dayDiff < 7 && dayDiff + ' days ago' ||
      dayDiff < 31 && Math.ceil(dayDiff / 7) + ' weeks ago';
  }

  Date.prototype.subtractDays = function(days) {
    this.setDate(this.getDate() - days);
    return this;
  }

  return Tumblr.Fox;
});
