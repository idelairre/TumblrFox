# Tumblr (fox) filter

## Features

+ Filter and search your dashboard posts, liked posts and tumblog posts by type, reblog status, popularity, tag or date
+ Filter and search through tumblelogs you're following
+ Download and cache your liked posts
+ Tumblr client-side data (primarily Backbone models and collections) are used where possible to benefit from improved performance and richer data over the public api.

## tl:dr

A Chrome extension that adds a new navigation tab and dropdown that allows you to fetch posts of a certain type, from a certain user or search for posts from a specific user by tag.

## In action

![TumblrFox](http://66.media.tumblr.com/a8557aa9708ca846b2f16cd124e646b9/tumblr_inline_o76peloRJ81qcc1rk_540.png)

![TumblrFox](http://66.media.tumblr.com/70bd5f3ed882614080cc155a062129ea/tumblr_inline_o76p4h28oB1qcc1rk_500.png)

![TumblrFox](http://66.media.tumblr.com/2a68911844e64558c31a59b91cba5e2e/tumblr_inline_o76p32BskA1qcc1rk_500.png)

![TumblrFox](http://66.media.tumblr.com/ee05005d616b2614768cac0b6f2c3a4b/tumblr_inline_o76p3tU1Vx1qcc1rk_500.png)

## The idea

+ Create new components by aggregating Tumblr features that are often over looked or have a silly implementation (indash blogs) or complicated UI (in dash post filter filter options are hidden until a search term is entered... why?) or are arbitrarily disabled (there is a perfectly functional NSFW filter that I can't otherwise figure out how to enable) into a functional component.
+ Create tools, mixins, etc. to make developing Backbone components using Tumblr code easier.
+ Leverage es6 + es7 features while maintaining a code style consistent with Tumblr's code base

## Problems

+ Since TumblrFox makes heavy use of local resources, clearing your browser cache can wipeout TumblrFox's database!

## The future

+ Use Firebase to store data server side and speed up initial caching (in development)

## To do

+ Improve user experience for initial caching functions
+ Tag search on enter
+ Fix Tumblr popover so term search can take advantages of multiple queries (right now it only takes one and is stupid)
+ Find a way to speed up caching process
+ Sync followers on follow/unfollow events
+ Indicate that tag caching is done when ajax response is empty
+ Wrap utils in a module, split utils between front-end and back-end

## Relevant development posts

1. http://luxfoks.tumblr.com/post/142342782841/tumblr-notes-pt-1
2. http://luxfoks.tumblr.com/post/142392103991/tumblr-notes-pt-2
3. http://luxfoks.tumblr.com/post/142476902926/tumblr-notes-pt-3
4. http://luxfoks.tumblr.com/post/142659709101/tumblr-notesthotz-pt-4
5. http://luxfoks.tumblr.com/post/143001544861/tumblr-notes-pt-5

## Installation

	$ npm install

## Usage

Run `$ npm run start` and load the `dist`-directory into chrome.

## Tasks

### Build

	$ gulp


| Option         | Description                                                                                                                                           |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--watch`      | Starts a livereload server and watches all assets. <br>To reload the extension on change include `livereload.js` in your bundle.                      |
| `--production` | Minifies all assets                                                                                                                                   |

### Test

	$ npm run tests

### Pack

Zips your `dist` directory and saves it in the `packages` directory.

    $ gulp pack --vendor=chrome
