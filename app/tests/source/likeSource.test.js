import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import LikeSource from '../../app/background/source/likeSource';
import fixture from '../fixtures/likes.html';
import 'babel-polyfill';

let xhr, requests;

describe('fetch', () => {
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

  describe('likeSource', () => {
    it ('fetches liked posts', done => {
      LikeSource.fetch().then(response => {
        expect(response).to.exist;
        done();
      });
      requests[0].respond(200, { 'Content-Type': 'text/html' }, fixture);
    });
  });
});
