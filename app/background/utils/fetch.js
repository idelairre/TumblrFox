import { ajax, Deferred } from 'jquery';

async function fetch() {
  const deferred = Deferred();
  ajax({
    type: 'GET',
    url: this.options.url,
    timeout: 300000,
    success: data => {
      if (typeof this.parse === 'function') {
        const processedData = this.parse(data);
        deferred.resolve(processedData);
      } else {
        deferred.resolve(data);
      }
    },
    error: err => {
      if (e.statusText === 'timeout') {
        deferred.reject(this.TIMEOUT_MESSAGE);
      } else {
        deferred.reject(err);
      }
    }
  });
  return deferred.promise();
}

export default fetch;
