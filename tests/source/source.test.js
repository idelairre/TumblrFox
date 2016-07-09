import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import Source from '../../app/background/source/source';
import fixture from '../fixtures/blogPosts.html';
import 'babel-polyfill';

let xhr, requests;

describe('Source', () => {
  describe('initialize', () => {
    it ('should assign the defaults hash to options', () => {
      const source = new Source({
        options: {
          yo: 'yo'
        }
      });
    });
  })
});
