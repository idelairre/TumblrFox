import { template } from 'lodash';
import View from '../view/view';
import authenticationTemplate from './authentication.html';
import './authentication.less';

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
  template: template(authenticationTemplate),
  className: 'authentication',
  tagName: 'section',
  render() {
    this.$el.html(this.template(this.props.attributes));
  }
});

export default Authentication;
