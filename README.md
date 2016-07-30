# Tumblr (fox) filter

## Features

+ Filter and search your dashboard posts, liked posts and tumblog posts by type, reblog status, popularity, tag or date
+ Filter and search through tumblelogs you're following
+ Download and cache your liked posts
+ Full text search your cached posts

## tl;dr

A Chrome extension that adds a new navigation tab and dropdown that allows you to filter and search through your dashboard/liked/following posts via text search, type or tag.

## In action

![TumblrFox](http://66.media.tumblr.com/a8557aa9708ca846b2f16cd124e646b9/tumblr_inline_o76peloRJ81qcc1rk_540.png)

![TumblrFox](http://66.media.tumblr.com/70bd5f3ed882614080cc155a062129ea/tumblr_inline_o76p4h28oB1qcc1rk_500.png)

![TumblrFox](http://66.media.tumblr.com/2a68911844e64558c31a59b91cba5e2e/tumblr_inline_o76p32BskA1qcc1rk_500.png)

![TumblrFox](http://66.media.tumblr.com/ee05005d616b2614768cac0b6f2c3a4b/tumblr_inline_o76p3tU1Vx1qcc1rk_500.png)

## The idea

+ Create new components by aggregating Tumblr features that are often over looked or have a silly implementation (such as indash blogs) or complicated UI (filter options for indash blog posts are hidden until a search term is entered... why?) or are arbitrarily disabled (Tumblr has a decently functioning NSFW filter for indash blog posts, why is it disabled by default?) into a functional component.
+ Create tools, mixins, etc. to make developing Backbone components using Tumblr code easier

## Problems

+ Since TumblrFox makes heavy use of local storage, clearing your browser cache can wipeout TumblrFox's database!
+ Tumblr api is inconsistent when it comes to fetching follower and dashboard data (i.e., data where you have to specify offsets: https://groups.google.com/forum/#!topic/tumblr-api/aFiFJ9DB-us).

## The future

+ Filter seen posts
+ Look ahead on dashboard posts/cache sessions

## To do

+ Find a way to speed up caching process
+ Test everything
+ Create distributions for Firefox/Safari/etc...

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

	$ npm run build

### Tests

	$ npm run tests

### Pack

Zips your `dist` directory and saves it in the `packages` directory.

    $ gulp pack --vendor=chrome
