import Backbone from 'backbone';
import _ from 'lodash';
import $ from 'jquery';

const subviewConstructor = (subview, el) => {
  return {
    constructor: subview,
    options: opts => {
      let element = {};
       if (_.isFunction(el)) {
        element = el(opts);
       } else {
        element = el;
      }
      return _.extend(_.pick(opts, opts.viewOptionKeys), element);
    }
  };
};

const subviewRenderer = (element, view, options) => { // e is either a function or an html string
  if (_.isFunction(element)) {
    element = element(view, options);
    if (element instanceof Backbone.View) {
      return element;
    }
  } else {
    view.$(element);
  }
};

const View = Backbone.View.extend({
    rendered: false,
    disposed: false,
    keepElement: false,
    _setup(element) {
        element = element || {};
        const defaults = _.extend({}, _.result(this.constructor.__super__, 'defaults'), _.result(this, 'defaults'));
        _.extend(defaults, _.pick(element, _.keys(defaults)));
        this.attributes = {};
        this.set(defaults);
        this.changed = {};
        const render = this.render;
        this.render = _.bind(() => {
          this._beforeRender.apply(this, arguments);
          this.beforeRender.apply(this, arguments);
          render.apply(this, arguments);
          this.afterRender.apply(this, arguments);
          this._afterRender.apply(this, arguments);
        });
        const remove = this.remove;
        this.remove = _.bind(() => {
          if (this.disposed) {
            return this;
          }
          this._beforeRemove.apply(this, arguments);
          this.beforeRemove.apply(this, arguments);
          remove.apply(this, arguments);
          this.afterRemove.apply(this, arguments);
          this._afterRemove.apply(this, arguments);
        });
      this.subviews = _.extend({}, this.subviews, element.subviews);
    },
    initialize: _.noop,
    _registerSubview(e) {
        this._subviews = this._subviews || [];
        this._subviews.push(e);
        return e;
    },
    appendSubview(subview, template) {
      if (_.isString(template)) {
        template = this.$(template);
        this._registerSubview(subview);
        subview.render();
        (template || this.$el).append(subview.el);
        return subview;
      }
    },
    removeSubviews() {
      const subviews = _.flatten(this._subviews);
      if (typeof subviews !== 'undefined' && subviews.length > 0) {
        _.invoke(subviews, 'remove');
        delete this._subviews;
      }
    },
    renderSubviews() {
      if (!this.subviews) {
        return;
      }
      _.each(this.subviews, (subview, key) => {
        console.log('[SUBVIEW]:', subview, '[KEY]:', key);
        // console.log(subview.constructor.prototype instanceof Backbone.View);
        if (subview.constructor.prototype instanceof Backbone.View) {
          ::this.renderSubview(subview, {
            name: key
          });
          if (subview.collection) {
            ::this.renderCollectionSubviews(key);
          } else {
            ::this.renderSubview(key);
          }
        }
      });
    },
    _createDefaultContainerFunction(e) {
      return _.bind(() => {
          return this.$(`[data-subview="${e}[]"]`);
      });
    },
    _createDefaultPrepareViewFunction(e) {
      const subviewConstructor = this.subviews[e];
      const prepareView = _.bind((n, i) => { // signature: n = function, i = not sure
          const subview = new subviewConstructor.constructor(i);
          subview.$el.attr('data-subview', e);
          n.append(subview.$el);
          return subview;
      });
      return prepareView;
    },
    renderCollectionSubviews(e) {
      const subview = this.subviews[e];
      if (subview) {
        const subviewContainer = subview.container || this._createDefaultContainerFunction(e);
        const prepareView = subview.prepareView || this._createDefaultPrepareViewFunction(e);
        const options = subview.options || {};
        const collectionRenderer = this.createCollectionSubviewRenderer(subview.collection, subviewContainer, prepareView, options, e);
        if (this.rendered) {
          collectionRenderer();
        } else {
          this.once('rendered', collectionRenderer, this);
        }
      }
    },
    renderSubview(subview, opts) { // e = subview
      console.log('[RENDER SUBVIEW CALLED]', subview, opts);
      const container = subview.container || `[data-subview="${opts.name}"]`;
      const options = subview.options || {};
      if (!_.isEmpty(subview)) {
        const view = new subview.constructor();
        view.render();
        view.$el.attr('data-subview', opts.name);
        console.log(view);
        // subview.replaceWith(view.$el);
        return subview;
      }
      // const subviewRenderer = this.createSubviewRenderer(container, prepareView, options, name); // what is this last param?
      // console.log(subviewRenderer, container, prepareView, options, name);
      // console.log('[RENDERED?]', this.rendered);
      if (this.rendered) {
        // subviewRenderer();
      } else {
        // this.once('rendered', subviewRenderer, this);
      }
    },
    createSubviewRenderer(container, prepareViewFunc, template, options) {
      console.log('[CREATE SUBVIEW RENDERER CALLED]', template, options);
      return _.bind(() => {
        if (this.el) {
          prepareViewFunc = prepareViewFunc || {};
          if (_.isFunction(prepareViewFunc)) {
            prepareViewFunc = prepareViewFunc.call(prepareViewFunc, this);
          }
          const renderer = subviewRenderer(container, this, options);
          console.log('[RENDERER]', renderer);
          if (!_.isEmpty(renderer)) {
            const subview = template.call(this, renderer, prepareViewFunc);
            if (options) {
               _.set(this, options, subview);
             }
            subview.render();
            this._registerSubview(subview);
          }
        }
      });
    },
    createCollectionSubviewRenderer(collection, subviewContainer, prepareViewFunc, options, a, l, c) { // e = collection, this.createCollectionSubviewRenderer(subview.collection, subviewContainer, prepareView, options, e);
      console.log(arguments);
        // let u;
        // return _.bind(() => {
        //     if (this.el) {
        //         let h = 0;
        //         if (a) {
        //            if (l) {
        //              h = this[a].length;
        //            } else {
        //              this[a] = [];
        //            }
        //           collection === !0 && (collection = this.collection), _.isFunction(collection) && (collection = collection(this)), collection instanceof Backbone.Collection && (collection = collection.models), !_.isEmpty(collection)) {
        //             let d = i(subviewContainer, this, a);
        //             if (_.isEmpty(d)) {
        //               l || (u = d, d = _.clone()), _.forEach(collection, (e, t) => {
        //                 let i;
        //                 if (_.isFunction(o)) {
        //                   i = o.call(o, this, collection) || {};
        //                 } else {
        //                   i = _.extend({}, o);
        //                 }
        //                 i.model || (i.model = e);
        //                 let r = '';
        //                 a && (r = a + '[' + (h + t) + ']');
        //                 c && _.extend(i, c);
        //                 this.createSubviewRenderer(d, n, i, r).call(this);
        //             }),
        //             l || u.replaceWith(d));
        //         }
        //       }
        //     }
        // });
    },
    _beforeRender: _.noop,
    beforeRender: _.noop,
    render() {
      console.log('[RENDERED]', this);
      if (this.disposed) {
        return false;
      }
      this.renderWithTemplate();
      return this;
    },
    afterRender: _.noop,
    _afterRender() {
        this.renderSubviews();
        this.rendered = !0;
        this.trigger('rendered', this);
        this._verifySubviewsRendered();
    },
    getTemplateData() {
      const subview = subviewConstructor(this);
      if (this.model) {
        subview.model = subviewConstructor(this.model);
      }
      if (this.collection) {
        subview.collection = {
          items: subviewConstructor(this.collection),
          length: this.collection.length
        };
      }
      return subview;
    },
    renderWithTemplate() {
        if (_.isUndefined(this.template)) {
          throw new Error('Template function needed.');
        }
        let template = {};
        if (_.isFunction(this.template)) {
          this.template(this.getTemplateData());
        } else {
          template = this.template;
          return template;
        }
        this.$el.html(template);
        return this;
    },
    afterRenderSubviews: _.noop,
    _verifySubviewsRendered() {
        const afterRenderSubviews = _.bind(() => {
            this.afterRenderSubviews();
            this.trigger('renderedSubviews');
        });
        const subviews = _.reject(this._subviews, subview => { // filter out rendered templates
          return subview.rendered === !0 || subview._rendered === !0;
        });
        if (_.isEmpty(subviews)) {
           afterRenderSubviews();
         } else {
          $.map(subviews, e => { // this, I imagine can be done more simply
            return $.promise(_.partial(subview => {
              e.once('rendered', subview);
            }, afterRenderSubviews));
        }).then(afterRenderSubviews);
      }
    },
    _beforeRemove() {
      this.removeSubviews();
    },
    beforeRemove: _.noop,
    remove() {
      if (this.keepElement) {
        this.undelegateEvents();
        this.stopListening();
      } else {
         Backbone.View.prototype.remove.apply(this, arguments);
      }
      return this;
    },
    afterRemove: _.noop,
    _afterRemove() {
      const elements = ['el', '$el', 'options', 'model', 'collection', 'subviews', '_subviews', 'defaults', 'attributes'];
      _.forEach(elements, _.bind(el => {
        if (this[el]) {
           delete this[el];
         }
      }));
      this.rendered = false;
      this.disposed = true;
    }
});

export default View;
