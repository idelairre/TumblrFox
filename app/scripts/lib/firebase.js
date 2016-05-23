import { keyBy, toArray } from 'lodash';
import { ajax, Deferred } from 'jquery';
import constants from '../constants';
import 'babel-polyfill';

export default class Firebase {
  static get(endPoint, item) {
    const deferred = Deferred();
    let url = `https://tumblrfox.firebaseio.com/${constants.get('userName')}/${endPoint}`;
    if (typeof item !== 'undefined') {
      url = `${url}/${item.id}.json`;
    } else {
      url = `${url}.json`;
    }
    console.log('[URL]', url);
    ajax({
      type: 'GET',
      url,
      success: data => {
        console.log(data);
        deferred.resolve(toArray(data));
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
    ajax({
      type: 'DELETE',
      url: `https://tumblrfox.firebaseio.com/${constants.get('userName')}/${endPoint}.json`,
      success: () => {
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
    ajax({
      type: 'PUT',
      accept: 'application/json',
      url: `https://tumblrfox.firebaseio.com/${constants.get('userName')}/${endPoint}/${item[key]}.json?print=silent`,
      dataType: 'json',
      // beforeSend: request => {
      //   request.setRequestHeader('Keep-Alive', true);
      // },
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
    console.log('[UPLOADING]');
    ajax({
      type: 'PATCH',
      accept: 'application/json',
      contentType: 'application/json; charset=utf-8',
      // beforeSend: request => {
      //   request.setRequestHeader('Keep-Alive', true);
      // },
      dataType: 'json',
      url: `https://tumblrfox.firebaseio.com/${constants.get('userName')}/${endPoint}.json?print=silent`,
      data: JSON.stringify(items),
      success: data => {
        console.log('[UPLOAD COMPLETE]');
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
