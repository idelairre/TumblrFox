import { isEqual, noop, pick } from 'lodash';
import { Generator } from 'tumblr-faker';
import sinon from 'sinon';
import mockDb from '../fixtures/db';
import ModuleInjector from 'inject!../../constants';
import Source from '../../source/source';
import parse from '../../utils/parsePosts';
import 'script!jasmine-sinon';

const constants = ModuleInjector({
  '../lib/db': mockDb,
}).default;

const args = {
  url: 'https://www.tumblr.com/likes',
  page: 0,
  iterator: 'page',
  item: 'likes',
  until: true,
  parse(items) {
    return items;
  },
  step: noop,
  condition() {
    return true;
  }
};

constants.set('debug', true);

describe('Source', () => {
  describe('constructor()', () => {
    it ('should work', () => {
      const source = new Source(args);
      expect(source).toBeDefined();
    });

    it ('should assign arguments to the options hash', done => {
      const source = new Source(args);
      if (source.initialized) {
        expect(source.defaults).toBeDefined();
        expect(isEqual(source.defaults, pick(args, Object.keys(source.defaults)))).toBe(true);
        done();
      } else {
        source.addListener('initialized', () => {
          expect(source.defaults).toBeDefined();
          expect(isEqual(source.defaults, pick(args, Object.keys(source.defaults)))).toBe(true);
          done();
        });
      }
    });
  })

  describe('start()', () => {
    it ('should assign "sync" and "retryTime" properties to source object', () => {
      const source = new Source(args);
      source.start({
        sync: true,
        retryTimes: 1
      });
      expect(source.sync).toBe(true);
      expect(source.retryTimes).toBe(1);
      source.stop();
    });

    it ('should call run()', () => {
      const source = new Source(args);
      spyOn(source, 'run');
      source.start({
        sync: true,
        retryTimes: 1
      });
      expect(source.run).toHaveBeenCalled();
      source.stop();
    });
  });

  describe('fetch()', () => {
    it ('should fetch items', async done => {
      const source = new Source(args);
      const response = await source.fetch();
      expect(response).toBeDefined();
      done();
    });

    it ('should call parse() if it is defined', async done => {
      const source = new Source(args);
      spyOn(source, 'parse');
      const response = await source.fetch();
      expect(source.parse).toHaveBeenCalled();
      done();
    });
  });

  describe('run()', () => {
    beforeEach(() => {
      args.step = function() {
        this.options.page += 1;
        this.options.url = `https://www.tumblr.com/likes/page/${this.options.page}`;
      }
    });

    it ('should call crawl()', async done => {
      const source = new Source(args);
      spyOn(source, 'crawl').and.returnValue([]); // TODO: reimplement with generator
      await source.run();
      expect(source.crawl).toHaveBeenCalled();
      done();
    });

    it ('should call step()', async done => {
      const source = new Source(args);
      spyOn(source, 'step');
      await source.run();
      expect(source.step).toHaveBeenCalled();
      done();
    });

    it ('should call stop() when its stop condition is met', async done => {
      const condition = function () {
        return this.page === 1;
      }
      const source = new Source(args);

      spyOn(source, 'done');
      spyOn(source, 'condition').and.callFake(condition);

      await source.run();

      expect(source.condition).toHaveBeenCalled()
      expect(source.done).toHaveBeenCalled();
      done();
    });

    it ('should emit "items" event after crawling', async done => {
      const source = new Source(args);
      source.addListener('items', items => {
        expect(items).toBeDefined();
        source.stop();
        done();
      });
      source.run();
    });

    it ('should automatically call itself until its stop condition is met and if the "sync" param is set to true', async done => {
      const condition = function () {
        return this.options.page < 3;
      }
      const step = function () {
        this.options.page += 1;
        this.options.url = `https://www.tumblr.com/likes/page/${this.options.page}`;
      }
      args.condition = condition;
      args.sync = true;
      const source = new Source(args);
      const crawl = sinon.stub(source, 'crawl').returns(Promise.resolve(Generator.posts.generateMany(10)));
      source.addListener('done', () => {
        expect(crawl).toHaveBeenCalledThrice();
        done();
      });
      source.run();
    });

    it ('should not automatically call itself if the "sync" param is not passed', async done => {
      let count = 0;
      const condition = function () {
        return this.options.page < 3;
      }
      const step = function () {
        this.options.page += 1;
        this.options.url = `https://www.tumblr.com/likes/page/${this.options.page}`;
      }
      args.condition = condition;
      args.step = step;
      delete args.sync;
      const source = new Source(args);
      const crawl = sinon.stub(source, 'crawl').returns(Promise.resolve(Generator.posts.generateMany(10)));
      source.addListener('next', () => {
        count += 1;
        expect(crawl).not.toHaveBeenCalledTwice();
      });
      source.run();
      setTimeout(() => {
        expect(count).toEqual(1);
        done();
      }, 4000);
    });
  });

  describe('stop()', () => {
    it ('should stop the run() method if it is in progress', done => { // NOTE: can't seem to interrupt this sooner
      const condition = function () {
        return this.options.page < 3;
      }
      const step = function () {
        this.options.page += 1;
        this.options.url = `https://www.tumblr.com/likes/page/${this.options.page}`;
      }
      args.condition = condition;
      args.step = step;
      delete args.sync;
      const source = new Source(args);
      const crawl = sinon.stub(source, 'crawl').returns(Promise.resolve(Generator.posts.generateMany(10)));
      source.addListener('done', () => {
        expect(source.crawl).not.toHaveBeenCalledTwice();
        done();
      });
      source.run();
      source.stop();
    });
  })
});
