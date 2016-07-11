module.exports = (function jquery($) {
  $.ajaxSetup({
    async: true
  });

  $.fn.removeAttributes = function (args) {
    const ignore = args.ignore;
    return this.each(function () {
      const attributes = $.map(this.attributes, item => {
        if (typeof ignore !== 'undefined' && item.name !== ignore) {
          return item.name;
        }
      });
      const elem = $(this);
      $.each(attributes, (i, item) => {
        elem.removeAttr(item);
      });
    });
  };
});
