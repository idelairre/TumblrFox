import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import $ from 'jquery';

let $fixture = $('<div id="view-fixture"></div>');

let { FilterPopoverIcon } = Tumblr.Fox;

describe('FilterPopoverIcon', () => {
  before(() => {
    $fixture.appendTo($('#fixtures'));
    $fixture.append('<div class="tab_bar" style="background-color: black; width: 50px"></div>');
    FilterPopoverIcon.render();
  });
  after(() => {
    // $fixture.empty();
  });
  describe('#render()', () => {
    it ('should show the popover when clicked', () => {
      FilterPopoverIcon.$el.find('button').trigger('click');
      expect(FilterPopoverIcon.$el.hasClass('active')).to.be.true;
      expect(Tumblr.Fox.options.rendered).to.be.true;
    });
  });
  describe('#show()', () => {
    it ('should hide when clicked again', () => {
      FilterPopoverIcon.$el.find('button').trigger('click');
      expect(Tumblr.Fox.options.rendered).to.be.true;
      expect(FilterPopoverIcon.$el.hasClass('active')).to.be.false;
    });
  });
});
