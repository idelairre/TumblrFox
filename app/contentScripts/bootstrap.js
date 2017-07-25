import $ from 'jquery';
import { has } from 'lodash';
import Tumblr from 'tumblr';
import App from './app';
import FilterPopoverIcon from './components/filterPopover/filterPopoverIcon';
import { Router } from './application/router';
import RouteController from './application/routerController';

function bootstrap() {
	console.time('initialize');

	if (has(Tumblr, 'Fox')) {
		console.error('There is already an instance of TumblrFox running');
		return;
	}

	Backbone.history.stop();

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

	// Tumblr.Fox.onHeartbeat('refreshFollowing', function () {
	// 	this.chromeTrigger('chrome:refresh:following');
	// });

	Tumblr.Fox.once('initialized', function () {
		console.timeEnd('initialize');
		Backbone.history.start();
	});

	Tumblr.Fox.start();
}

bootstrap();
