import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import constants from '../app/background/constants';
import SourceTest from './source/source.test';
import BlogSourceTest from './source/blogSource.test';
import LikeStoreTest from './stores/likeStore.test';
import LikeSourceTest from './source/likeSource.test';
import '../app/background/lib/livereload';
import 'mocha/mocha.css';

chrome.storage.local.get.yields(constants.defaults);
chrome.storage.sync.get.yields(constants.syncDefaults);

constants.set('userName', 'luxfoks');

chai.use(sinonChai);
