import State from '../models/stateModel';
import 'backbone.radio';

const state = new State({
  dashboard: false,
  disabled: false,
  user: false,
  likes: false
});

export default state;
