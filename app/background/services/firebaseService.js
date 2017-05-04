import { isFunction, isString, keyBy } from 'lodash';
import { ajax, Deferred } from 'jquery';
import { calculatePercent } from './loggingService';
import constants from '../constants';
import 'babel-polyfill';

export default class Firebase {
  static get(endPoint, item, port) {
    const deferred = Deferred();

    const calculateProgress = e => {
      if (e.lengthComputable) {
        port({
          type: 'progress',
          payload: calculatePercent(e.loaded, e.total)
        });
      }
    }

    let url = `https://tumblrfox.firebaseio.com/${constants.get('userName')}/${endPoint}`;

    if (isFunction(item)) {
      port = item;
    } else if (isString(item)) {
      url = `${url}/${item.id}`;
    }
    
    url = `${url}.json`;

    ajax({
      type: 'GET',
      accept: 'application/json',
      url,
      beforeSend: xhr => {
        if (!port) {
          return;
        }
        xhr.onprogress = calculateProgress;
      },
      success: response => {
        deferred.resolve(Array.toArray(response));
      },
      error: error => {
        console.log(error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  static delete(endPoint) {
    const deferred = Deferred();
    const url = `https://tumblrfox.firebaseio.com/${constants.get('userName')}/${endPoint}.json`;

    ajax({
      type: 'DELETE',
      url,
      success: response => {
        console.log('[DELETED CACHE]', response);
        deferred.resolve();
      },
      error: error => {
        console.log(error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  static put(endPoint, item, key) {
    const deferred = Deferred();
    const url = `https://tumblrfox.firebaseio.com/${constants.get('userName')}/${endPoint}/${item[key]}.json?print=silent`;

    ajax({
      type: 'PUT',
      accept: 'application/json',
      url,
      data: JSON.stringify(item),
      success: data => {
        console.log(data);
        deferred.resolve(data);
      },
      error: error => {
        console.log(error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }

  static bulkPut(endPoint, items, key) {
    const deferred = Deferred();
    items = keyBy(items, key || 'id');

    ajax({
      type: 'PATCH',
      accept: 'application/json',
      url: `https://tumblrfox.firebaseio.com/${constants.get('userName')}/${endPoint}.json?print=silent`,
      data: JSON.stringify(items),
      success: data => {
        deferred.resolve(data);
      },
      error: error => {
        console.log(error);
        deferred.reject(error);
      }
    });
    return deferred.promise();
  }
}
