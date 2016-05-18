import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

const $ = Backbone.$;

let $fixture = $('<div id="view-fixture"></div>');

let { Filters } = Tumblr.Fox;

let filters;

describe('FilterComponent', () => {
  before(() => {
    $fixture.appendTo($('#fixtures'));
    // $('#view-fixture').append($('#filterTemplate').html());
  });
  describe('#initialize()', () => {
    it('should exist', () => {
      expect(Filters).to.exist;
    });
    it('should share all the methods of Tumblr\'s peepr filter', () => {
    });
    it('should successfully set the date input value to today\'s date', () => {
    });
  });
});
