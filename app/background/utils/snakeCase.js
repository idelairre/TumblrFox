/**
 * Test whether a string is camel-case.
 */

const hasSpace = /\s/;
const hasSeparator = /[\W_]/;
const hasCamel = /([a-z][A-Z]|[A-Z][a-z])/;

/**
 * Camelcase splitter.
 */

const camelSplitter = /(.)([A-Z]+)/g;

/**
 * Un-camelcase a `string`.
 *
 * @param {String} string
 * @return {String}
 */

const uncamelize = string => {
  return string.replace(camelSplitter, (m, previous, uppers) => {
    return previous + ' ' + uppers.toLowerCase().split('').join(' ');
  });
};

/**
 * Separator splitter.
 */

const separatorSplitter = /[\W_]+(.|$)/g;

/**
 * Un-separate a `string`.
 *
 * @param {String} string
 * @return {String}
 */

const unseparate = string => {
  return string.replace(separatorSplitter, (m, next) => {
    return next ? ' ' + next : '';
  });
};

/**
 * Remove any starting case from a `string`, like camel or snake, but keep
 * spaces and punctuation that may be important otherwise.
 *
 * @param {String} string
 * @return {String}
 */

const clean = string => {
  if (hasSpace.test(string)) {
    return string.toLowerCase();
  }
  if (hasSeparator.test(string)) {
    return (unseparate(string) || string).toLowerCase();
  }
  if (hasCamel.test(string)) {
    return uncamelize(string).toLowerCase();
  }
  return string.toLowerCase();
};

const toSpaceCase = string => {
  return clean(string).replace(/[\W_]+(.|$)/g, (matches, match) => {
    return match ? ' ' + match : '';
  }).trim();
};

const snakeCase = string => {
  return toSpaceCase(string).replace(/\s/g, '_');
};

export default snakeCase;
