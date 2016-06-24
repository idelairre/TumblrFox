import $ from 'jquery';
import { isString, mapKeys } from 'lodash';
import View from '../../view/view';
import authenticationTemplate from './authentication.html';

const Authentication = View.extend({
  defaults: {
    props: {
      consumerKey: '',
      consumerSecret: '',
      userName: '',
      defaultKeys: true,
      setUser: false
    }
  },
  template: $(authenticationTemplate).html(),
  className: 'authentication options',
  tagName: 'section',
  render() {
    this.$el.html(this.template);
    this.$el.hide();
    return this;
  },
  renderProps(props) {
    mapKeys(props, (value, key) => {
      if (isString(value)) {
        this.$el.find(`input#${key}`).val(value);
      }
    });
    this.toggleState();
  },
  toggleState() {
    this.toggleUserInputVisibity();
    this.toggleKeyInputVisibility();
    this.toggleAuthDivVisibility();
  },
  toggleUserInputVisibity() {
    if (this.props.get('setUser')) {
      this.$('.user').show();
    } else {
      this.$('.user').hide();
    }
  },
  toggleKeyInputVisibility() {
    if (this.props.get('defaultKeys')) {
      this.$('.consumer-secret').hide();
      this.$('.consumer-key').hide();
    } else {
      this.$('.consumer-secret').show();
      this.$('.consumer-key').show();
    }
  },
  toggleAuthDivVisibility() {
    if (!this.props.get('setUser') && this.props.get('defaultKeys')) {
      this.$el.hide();
    }
    if (!this.props.get('defaultKeys') || this.props.get('setUser')) {
      this.$el.show();
    }
  }
});

export default Authentication;
