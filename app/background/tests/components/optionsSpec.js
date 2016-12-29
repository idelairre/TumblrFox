import $ from 'jquery';
import { Events, Model } from 'backbone';
import Options from '../../components/options';
import constants from '../../constants';
import optionsHtml from '../fixtures/options.html';

const fixture = setFixtures(optionsHtml);
const container = fixture.find('.container');

const Messager = (function () {
  const _listeners = [];
  return {
    onMessage: {
      addListener(cb) {
        _listeners.push(cb);
      }
    },
    postMessage(data) {
      _listeners.forEach(cb => {
        cb.call(this, data);
      });
    }
  }
})();

chrome.runtime.connect.returns(Messager);

let options;

describe('Options', () => {
  describe('initialize()', () => {
    beforeAll(() => {
      options = new Options({
        model: new Model(constants.toJSON()),
        el: $(container)
      });
    });

    afterAll(() => {
      options.remove();
    });

    it ('should initialize the chrome runtime port', () => {
      expect(chrome.runtime.connect).toHaveBeenCalled();
      expect(options.port).toBeDefined();
    });
  });

  describe('remove()', () => {
    it ('should remove all subviews', () => {
      options = new Options({
        model: new Model(constants.toJSON()),
        el: $(container)
      });

      options.remove();

      expect(options._subviews.length).toBe(0);
    });

    describe('updateProps()', () => {
      it ('should update all subview prop models', () => {

      });
    });
  });
});
