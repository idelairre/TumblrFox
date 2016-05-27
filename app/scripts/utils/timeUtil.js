module.exports = (function time(Tumblr, Backbone, _) {
  const { Utils } = Tumblr.Fox;

  Utils.toTumblrTime = date => {
    return Date.parse(date) / 1000;
  };

  Utils.fromTumblrTime = dateValue => {
    return new Date(dateValue * 1000);
  };

  Utils.decrementTumblrDay = date => {
    return Tumblr.Fox.toTumblrTime(Tumblr.Fox.fromTumblrTime(date).subtractDays(1));
  };

  Utils.prettyDate = date => {
    const diff = (((new Date()).getTime() - date.getTime()) / 1000);
    const dayDiff = Math.floor(diff / 86400);

    if (isNaN(dayDiff) || dayDiff < 0 || dayDiff >= 31) {
      return date.toString().split(' ').slice(0, 4).join(' ');
    }

    return dayDiff === 0 && (diff < 60 && 'just now' || diff < 120 && '1 minute ago' || diff < 3600 && Math.floor(diff / 60) + ' minutes ago' || diff < 7200 && '1 hour ago' || diff < 86400 && Math.floor(diff / 3600) + ' hours ago') ||
      dayDiff === 1 && 'Yesterday' || dayDiff < 7 && dayDiff + ' days ago' || dayDiff < 31 && Math.ceil(dayDiff / 7) + ' weeks ago';
  };

  Date.prototype.subtractDays = function (days) {
    this.setDate(this.getDate() - days);
    return this;
  };

  Date.prototype.toDateInputValue = function () {
    const local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
  };
});
