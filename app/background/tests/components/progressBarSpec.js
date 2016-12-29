import { Events } from 'backbone';
import ProgressBar from '../../components/progressBar/progressBar';
import optionsHtml from '../fixtures/options.html';

const fixture = setFixtures(optionsHtml);

let progressBar;

describe('ProgressBar', () => {
  // describe('afterRender()', () => {
  //   beforeAll(() => {
  //     progressBar = new ProgressBar();
  //     progressBar.render();
  //   });
  //
  //   afterAll(() => {
  //     progressBar.remove();
  //   });
  //
  //   it ('should correctly initialize the "$bar" attribute', done => {
  //     setTimeout(() => {
  //       expect(progressBar.$bar).toBeDefined();
  //       done();
  //     });
  //   });
  // });

  describe('animateProgress()', () => {
    beforeAll(() => {
      spyOn(ProgressBar.prototype, 'animateProgress');

      progressBar = new ProgressBar();
      progressBar.render();
    });

    afterAll(() => {
      progressBar.remove();
    });

    it ('should trigger "CHANGE_PROPS" event', () => {
      Events.trigger('PROGRESS', {
        payload: {
          constants: {},
          percentComplete: 50
        }
      });
      expect(progressBar.animateProgress).toHaveBeenCalledTimes(1);
    });
  });
});
