import { countBy, flatten, identity } from 'lodash';
import db from '../lib/db';
import { log } from '../utils/loggingUtil';

export default class Tags {
  // TODO: break this up so that it can report progress to front end
  // NOTE: this had a tendency to crash the browser
  static parseTags(tags, callback) {
    const parsedTags = [];
    const orderedTags = countBy(tags, identity);
    for (const key in orderedTags) {
      const tag = {
        tag: key,
        count: orderedTags[key]
      };
      parsedTags.push(tag);
    }
    callback(parsedTags);
  }

  static cacheLikeTags(callback) {
    console.log('[CACHING TAGS...]');
    const items = {
      totalTagsCount: 0,
      cachedTagsCount: 0,
      total: 0
    };
    db.posts.orderBy('tags').keys(tags => {
      console.log('[TAGS LENGTH]', tags.length);
      tags = flatten(tags.filter(tagArray => {
        if (tagArray.length > 0) {
          return tagArray;
        }
      }));
      this.parseTags(tags, response => {
        console.log('[TAGS]', tags.length);
        let i = 0;
        while (response.length > i) {
          db.tags.put(response[i]);
          items.total = response.length;
          i += 1;
          log('tags', i, items, response => {
            callback(response);
          });
        }
      });
    });
  }

  static fetchLikeTags(callback) {
    console.log(db);
    db.tags.orderBy('count').reverse().toArray(tags => {
      console.log('[STORED TAGS]', tags);
      callback(tags);
    });
  }
}
