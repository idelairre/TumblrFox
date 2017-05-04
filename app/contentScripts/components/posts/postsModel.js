import $ from 'jquery';
import { has, invoke, pick } from 'lodash';
import AppState from '../../application/state';
import Autopaginator from '../autopaginator/autopaginatorModel';
import BlogModel from './blogModel';
import ControllerModel from './controllerModel';
import DashboardModel from './dashboardModel';
import Events from '../../application/events';
import LikesModel from './likesModel';
import LoaderComponent from '../loader/loaderComponent';
import SearchModel from '../filterPopover/search/searchModel';
import SearchResultsComponent from '../searchResults/searchResultsComponent';
import Utils from '../../utils';

// NOTE: scrolling while searching tries to render results when there are none and disables the autopaginator

const PostsModel = ControllerModel.extend({
  models: {
    blogModel: {
      constructor: BlogModel
    },
    dashboardModel: {
      constructor: DashboardModel,
      options: opts => {
        return {
          state: opts.state
        }
      }
    },
    likesModel: {
      constructor: LikesModel
    }
  },
  defaults: {
    loading: false,
    searching: false
  },
  initialize(options) {
    Object.assign(this, pick(options, ['searchModel', 'state']));

    if (this.state.get('disabled')) {
      return this;
    }

    this.postViews = Tumblr.postsView;
    this.posts = this.postViews.postViews;

    this.autopaginator = new Autopaginator({
      model: this.searchModel,
      posts: this
    });
    this.loader = new LoaderComponent({
      el: $('#auto_pagination_loader_loading')
    });
    this.searchResults = new SearchResultsComponent({
      searchModel: this.searchModel,
      state: this.state
    });
    this.set(this.defaults);
    this.bindEvents();
    return this;
  },
  resetSlug() {
    this.searchModel.set('next_offset', 0);
  },
  incrementOffset(resultsLength) {
    const offset = this.searchModel.get('next_offset') + resultsLength;
    this.searchModel.set('next_offset', offset);
  },
  bindEvents() {
    this.listenTo(Events, 'fox:fetch:complete', this.toggleLoading.bind(this, false));
    this.listenTo(Tumblr.AutoPaginator, 'after', ::this.filterAds);
  },
  unbindEvents() {
    // this.stopListening();
  },
  fetch(slug) {
    const deferred = $.Deferred();

    this._prepareRequest();
    this.toggleLoading(true);

    const fetchHelper = posts => {
      if (posts.length > 0) {
        Utils.PostFormatter.renderPosts(posts);
      }
      this.incrementOffset(posts.length);
      this.evalAndLogResults(posts);
      Tumblr.Fox.Events.trigger('fox:fetch:complete', posts); // this turns off the loader bar
      deferred.resolve();
    };

    switch (this.state.getState()) {
      case 'user':
        this.blogModel.fetch(slug).then(response => {
          if (has(response, 'posts')) {
            const { posts, query } = response;
            this.searchModel.set(query);
            fetchHelper(posts);
          } else {
            fetchHelper(response);
          }
        });
        break;
      case 'dashboard':
        if (slug.term.length > 0) {
          return this.renderSearchResults(slug).then(fetchHelper);
        }
        
        this.dashboardModel.fetch(slug).then(response => {
          const { posts, query } = response;
          this.searchModel.set(query);
          fetchHelper(posts);
        });
        break;
      case 'likes':
        this.likesModel.search(slug).then(fetchHelper);
        break;
    }
    return deferred.promise();
  },
  search(query) {
    const deferred = $.Deferred();
    this._prepareRequest();

    const resultsHelper = results => {
      this.toggleLoading(false);
      this.incrementOffset(results.length);
      this.evalAndLogResults(results);

      if (results.length && results.length > 0) {
        Utils.PostFormatter.renderPosts(results);
      }

      deferred.resolve();
    };

    this.resetSlug();
    switch (this.state.getState()) {
      case 'likes':
        this.toggleLoading(true);
        this.likesModel.search(query).then(resultsHelper);
        break;
      case 'user':
        this.toggleLoading(true);
        this.blogModel.search(query).then(resultsHelper);
        break;
      case 'dashboard':
        this.set('searching', true);
        this.loader.show(); // want to keep the loader status decouped from posts model so results can be rendered
        this.dashboardModel.search(query).then(() => {
          this.set('searching', false);
          Tumblr.Fox.Events.trigger('fox:search:complete');
          this.loader.hide();
          deferred.resolve();
        });
      break;
    }
    return deferred.promise();
  },
  renderSearchResults(slug) {
    const deferred = $.Deferred();

    if (this.searchModel.get('renderedResults')) {
      return deferred.reject();
    }

    this.searchModel.getSearchResults(slug).then(matches => {
      setTimeout(() => deferred.resolve(matches), 500);
    });
    return deferred.promise();
  },
  evalAndLogResults(results) {
    if (results.length < this.searchModel.get('limit')) {
      if (!this.get('searching')) {
        this.searchModel.set('renderedResults', true);
        Tumblr.Fox.Events.trigger('fox:search:renderedResults', {
          loggingData: this.searchModel.toJSON()
        });
        this.autopaginator.stop();
      }
    }
  },
  toggleLoading(val) {
    this.set('loading', val);
    this.loader.setLoading(this.get('loading'));
  },
  _prepareRequest() {
    if (!this.autopaginator.get('enabled')) {
      this.autopaginator.start();
    }

    if (this.autopaginator.get('defaultPaginationEnabled')) {
      this.autopaginator.disableDefaultPagination();
    }

    this.searchModel.set('renderedResults', false);
  },
  filterAds() {
    this.postViews.$el.find('.standalone-ad-container').remove();
  },
  filterPosts() { // called by search component
    const deferred = $.Deferred();

    if (this.state.get('dashboard')) {
      this.dashboardModel.reset();
    }

    if (this.autopaginator.get('enableDefaultPagination')) {
      this.autopaginator.disableDefaultPagination();
    }

    this.postViews.collection.invoke('dismiss');
    $('li[data-pageable]').fadeOut(300).promise().then(() => {
      this.postViews.collection.reset();
      invoke(this.posts, 'remove');
      this.posts = [];
      $('li[data-pageable]').remove();
      $('.standalone-ad-container').remove();
      Events.trigger('fox:filteredPosts');
      deferred.resolve();
    });
    return deferred.promise();
  }
});

module.exports = new PostsModel({
  name: 'Posts',
  searchModel: SearchModel,
  state: AppState
});
