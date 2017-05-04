import B64 from './utils/b64Util';
import ComponentFetcher from './utils/componentFetcherUtil';
import PostFormatter from './utils/postFormatterUtil';
import TemplateCache from './utils/templateFetcherUtil';
import Time from './utils/timeUtil';
import promiseSeries from './utils/promiseSeries';

const Utils = {
  B64,
  ComponentFetcher,
  PostFormatter,
  TemplateCache,
  Time,
  promiseSeries
}

module.exports = Utils;
