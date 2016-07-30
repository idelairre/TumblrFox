import $ from 'jquery';
import Utils from '../utils'

const attachNode = $('#posts').find('li').last();
const formKey = $('#tumblr_form_key').attr('content');

const constants = JSON.parse(Utils.B64.decode(window.tumblrFoxConstants));

constants.attachNode = attachNode;
constants.rootUrl = 'https://www.tumblr.com/';
constants.formKey = formKey;

export default constants;
