import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import BlogSource from '../../app/background/source/blogSource';
import fixture from '../fixtures/blogPosts.html';
import 'babel-polyfill';

let xhr, requests;

describe('blogSource', () => {
  beforeEach(() => {
    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];
    xhr.onCreate = req => {
      requests.push(req);
    }
  });
  afterEach(() => {
    xhr.restore();
  });
  describe('fetch()', () => {
    it ('should fetch the current user\'s posts', done => {
      BlogSource.fetch().then(response => {
        expect(response).to.exist;
        done();
      });
      requests[0].respond(200, { 'Content-Type': 'text/html' }, fixture);
    });
    it ('should parse the html response into json', done => {
      BlogSource.fetch().then(response => {
        expect(response).to.be.an.instanceof(Array);
        response.forEach(post => {
          expect(post.tags).to.exist;
          expect(post.html).to.exist;
        });
        done();
      });
      requests[0].respond(200, { 'Content-Type': 'text/html' }, fixture);
    });
  });
  describe('start()', () => {
    it ('should return an empty array if the run condition is not true', done => {
      BlogSource.options.page = 1;
      BlogSource.options.until = 1;
      BlogSource.start().then(response => {
        expect(response).to.be.an.instanceof(Array);
        expect(response.length).to.equal(0);
        done();
      });
    });
    it ('should return an array of posts', done => {
      BlogSource.start().then(response => {
        expect(response).to.be.an.instanceof(Array);
        expect(response.length).to.equal(10);
        done();
      });
      requests[0].respond(200, { 'Content-Type': 'text/html' }, fixture);
    });
    it ('should increment the iterator value by 1 after each call', done => {
      BlogSource.reset();
      BlogSource.start().then(response => {
        expect(BlogSource.options[BlogSource.options.iterator]).to.equal(1);
        done();
      });
      requests[0].respond(200, { 'Content-Type': 'text/html' }, fixture);
    })
  });
});
