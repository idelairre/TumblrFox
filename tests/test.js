import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
// import FollowingStoreTest from './stores/followingStore.test';
// import LikeStoreTest from './stores/likeStore.test';
import LikeSourceTest from './source/likeSource.test';
import '../app/background/lib/livereload';
import 'mocha/mocha.css';

chai.use(sinonChai);
