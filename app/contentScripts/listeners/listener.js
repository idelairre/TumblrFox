import { extend } from 'lodash';
import Source from '../source/source';

const Listener = Source.extend({});

extend(Listener.prototype, Backbone.Events);

module.exports = Listener;
