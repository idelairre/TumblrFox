import { isArray, isEqual } from 'lodash';

export const isSorted = array => {
  const len = array.length - 1;
  for (let i = 0; i < len; ++i) {
    if (array[i] > array[i + 1]) {
      return false;
    }
  }
  return true;
}
