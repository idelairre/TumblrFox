import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import DashboardAutocompleteModel from '../../app/scripts/models/dashboardAutocompleteModel';

let dashboardAutocompleteModel = DashboardAutocompleteModel();

describe('dashboardAutocompleteModel', () => {
  describe('#initialize()', () => {
    it('should exist', () => {
      expect(dashboardAutocompleteModel).to.exist;
    });
    it('should successfully create a new dashboardAutocompleteModel', () =>{
      expect(dashboardAutocompleteModel.items).to.exist;
    });
  });
  describe('#fetch()', () => {
    it ('should return a promise', () => {
      expect(dashboardAutocompleteModel.fetch()).to.include.keys('then');
    });
    it ('should return a tag collection', done => {
      dashboardAutocompleteModel.fetch().then(items => {
        expect(items).to.not.be.empty;
        done();
      });
    });
    it ('should fire a fetch event', done => {
      let callback = sinon.spy();
      window.addEventListener('chrome:fetch:tags', () => {
        return callback();
      })
      dashboardAutocompleteModel.fetch().then(items => {
        expect(callback).to.have.been.called;
        done();
      });
    });
    it ('should trigger #parse()', () => {

    });
  });
});
