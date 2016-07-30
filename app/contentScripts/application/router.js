import { invert } from 'lodash';
import { ComponentFetcher } from '../utils';

const Backbone = ComponentFetcher.get('Backbone');

const Router = Backbone.Router.extend({
  constructor(options = {}) {
    this.options = options;
    Object.assign(this, this.options);
    Backbone.Router.apply(this, arguments);
    const appRoutes = this.options.appRoutes;
    const controller = this._getController();
    this.processAppRoutes(controller, appRoutes);
    this.on('route', this._processOnRoute, this);
  },
  appRoute(route, methodName) {
    const controller = this._getController();
    this.addAppRoute(controller, route, methodName);
  },
  _processOnRoute(routeName, routeArgs) {
    if (typeof this.onRoute === 'function') {
      const routePath = invert(this.options.appRoutes)[routeName];
      this.onRoute(routeName, routePath, routeArgs);
    }
  },
  processAppRoutes(controller, appRoutes) {
    if (!appRoutes) {
      return;
    }
    const routeNames = Object.keys(appRoutes).reverse();
    routeNames.map(route => {
      this.addAppRoute(controller, route, appRoutes[route]);
    });
  },
  _getController() {
    return this.options.controller;
  },
  addAppRoute(controller, route, methodName) {
    const method = controller[methodName];
    if (!method) {
      throw new Error(`Method "${methodName}" was not found on the controller`);
    }
    this.route(route, methodName, method.bind(controller));
  }
});

const RouteController = function(options) {
  if (typeof this.initialize === 'function') {
    this.initialize.call(this, options);
  }
}

RouteController.extend = Backbone.Model.extend;

module.exports = {
  Router,
  RouteController
}
