import { camelCase } from 'lodash';
import db from '../lib/db';

export function log(database, itemCount, items, callback) {
  db[database].toCollection().count(itemCount => {
    const cachedKey = camelCase(`cached-${database}-count`);
    const totalKey = camelCase(`total-${database}-count`);
    const { percentComplete, itemsLeft, total } = calculatePercent(itemCount, items.total);
    const storageSlug = {};
    storageSlug[cachedKey] = itemCount;
    if (items[totalKey] === 0 || items[totalKey] !== items.total) {
      storageSlug[totalKey] = items.total;
      items[totalKey] = items.total;
    }
    chrome.storage.local.set(storageSlug);
    console.log(`[PERCENT COMPLETE]: ${percentComplete}%, [ITEMS LEFT]: ${itemsLeft}`);
    callback({ database, percentComplete, itemsLeft, total });
  });
}

export function calculatePercent(count, objects) {
  const percentComplete = ((count / objects) * 100).toFixed(2);
  const itemsLeft = objects - count;
  const total = objects;
  return { percentComplete, itemsLeft, total };
}
