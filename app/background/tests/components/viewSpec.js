import $ from 'jquery';
import { values } from 'lodash';
import { Events, Model } from 'backbone';
import View from '../../components/view/view';

const TestView = View.extend({
  defaults: {
    props: {
      stuff: 'stuff'
    }
  }
});

let view;

describe('View', () => {
  describe('render()', () => {
    it ('should be called after props change', () => {
      view = new TestView({
        stuff: 'stuff'
      });

      spyOn(view, 'render');

      view.props.set('stuff', 'things');

      expect(view.render).toHaveBeenCalled();

      view.remove();
    });

    it ('should call afterRender()', done => {
      view = new TestView();

      spyOn(view, 'afterRender').and.callThrough();

      view.render();

      setTimeout(() => {
        expect(view.afterRender).toHaveBeenCalledTimes(1);
        expect(view.rendered).toBe(true);
        view.remove();
        done();
      }, 0);
    });
  });

  describe('remove()', () => {
    it ('should remove all event listeners', () => {
      view = new TestView();
      view.remove();

      expect(values(Events._listeners).length).toBe(0);
    });
  });
});
