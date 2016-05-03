import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import PostModel from '../../app/scripts/models/postModel';

let postModel = PostModel();

describe('postModel', () => {
  it('should exist', () => {
    expect(postModel).to.exist;
  });
  describe('#initialize()', () => {
    it('should successfully create a new dashboardAutocompleteModel', () => {
      expect(postModel.items).to.exist;
    });
  });
  describe('#fetch()', () => {
    it('should return a promise', () => {
      expect(postModel.fetch()).to.include.keys('then');
    });
  });
});
