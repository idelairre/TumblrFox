import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

let { FilterPopoverComponent } = Tumblr.Fox

describe('FilterPopoverComponent', () => {
  describe('#initialize()', () => {
    it('should exist', () => {
      expect(FilterPopoverComponent).to.exist;
    });
  });
});
