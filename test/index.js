import chai from 'chai';
import sinonChai from 'sinon-chai';
import Main from '../app/scripts/main';
import ComponentFetcher from '../app/scripts/utils/componentFetcher';
import FilterTemplate from '../app/scripts/components/filterPopover/filter/filterTemplate.html';
import FilterMenuTemplate from '../app/scripts/components/filterPopover/filterMenu/filterMenuTemplate.html';
import FilterPopoverTemplate from '../app/scripts/components/filterPopover/filterPopoverTemplate.html';
import FilterPopoverComponent from '../app/scripts/components/filterPopover/filterPopoverComponent';
import PostModel from '../app/scripts/models/postModel';
import SearchTemplate from '../app/scripts/components/filterPopover/search/searchTemplate.html'
import SettingsTemplate from '../app/scripts/components/filterPopover/settings/settingsPopover/settingsPopoverTemplate.html';

function initialize(dependencies) {
  for (let i = 0; dependencies.length > i; i += 1) {
    dependencies[i]();
  }
}

function injectTemplates(templates) {
  for (let i = 0; templates.length > i; i += 1) {
    document.body.insertAdjacentHTML('beforeend', templates[i]);
  }
}

initialize([ComponentFetcher, PostModel, Main, FilterPopoverComponent]);

injectTemplates([FilterTemplate, FilterMenuTemplate, FilterPopoverTemplate, SearchTemplate, SettingsTemplate]);

chai.use(sinonChai);

const context = require.context('.', true, /.+\.test\.js?$/);
context.keys().forEach(context);
module.exports = context;
