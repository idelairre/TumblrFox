import $ from 'jquery';
import { decode } from '../utils/b64Util';

const attachNode = $('#posts').find('li').last();
const formKey = $('#tumblr_form_key').attr('content');

let constants = {};

if (window.tumblrFoxConstants) {
  Object.assign(constants, JSON.parse(decode(window.tumblrFoxConstants)));
}

constants.attachNode = attachNode;
constants.rootUrl = 'https://www.tumblr.com/';
constants.formKey = formKey;

export default constants;
