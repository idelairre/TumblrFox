import $ from 'jquery';
import App from './app';
import Events from './application/events';
import FilterPopoverIcon from './components/filterPopover/filterPopoverIcon';
import FollowingModel from './components/followingList/followingModel';
import { Router } from './application/router';
import RouteController from './application/routerController';
import { ComponentFetcher } from './utils';

Backbone.history.stop();

function bootstrap() {

	let didBootstrap = false;

	const loaderObserver = new MutationObserver(initialize.bind(this));

	console.time('initialize');

	if (window.Tumblr) {
		initialize();
	} else {
		loaderObserver.observe(document, {
			childList: true,
			subtree: true
		});
	}

	function initialize() {
		if (!window.Tumblr || didBootstrap) {
			return;
		}

    Tumblr.Fox = App;

    Tumblr.Fox.RouteController = new RouteController({
			options: Tumblr.Fox.options,
			state: Tumblr.Fox.state
		});

    Tumblr.Fox.router = new Router({
      controller: Tumblr.Fox.RouteController,
      appRoutes: {
        'blog/:blogname': 'onBlog',
        'dashboard': 'onDashboard',
        'following': 'onFollowing',
        'likes': 'onLikes',
        '*path':  'defaultRoute'
      },
      onRoute(name, path, args) {
				Tumblr.Fox.Application.filterPopoverIcon = new FilterPopoverIcon({
	        options: Tumblr.Fox.options,
	        state: Tumblr.Fox.state
	      });
			}
    });

		Tumblr.Fox.onHeartbeat('refreshFollowing', function () { // TODO: add event listener for adding and deleting followers so this is called as necessary
			this.chromeTrigger('chrome:refresh:following');
		});

		Tumblr.Fox.once('initialized', function () {
			console.timeEnd('initialize');
			Backbone.history.start();
			this.chromeTrigger('chrome:refresh:following');
		});

		Tumblr.Fox.start();

		didBootstrap = true;
		loaderObserver.disconnect();
	}
}

if (document.readyState) {
	bootstrap();
} else {
	window.addEventListener('load', bootstrap);
}
