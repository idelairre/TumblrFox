  const promiseSeries = promises => {
    const p = $.Deferred().resolve();
    return promises.reduce((pacc, fn, index) => {
      return pacc = pacc.always(fn);
    }, p);
  }

  module.exports = promiseSeries;
