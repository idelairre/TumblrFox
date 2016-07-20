import $ from 'jquery';
import Utils from '../utils'

const listItems = $('#posts').find('li');
const attachNode = $(listItems[listItems.length - 1]);
const formKey = $('#tumblr_form_key').attr('content');

const constants = JSON.parse(Utils.B64.decode(window.tumblrFoxConstants));

constants.attachNode = attachNode;
constants.rootUrl = 'https://www.tumblr.com/';
constants.formKey = formKey;

export default constants;
