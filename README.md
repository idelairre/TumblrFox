# Tumblr (fox) filter

## Features

+ Filter and search your dashboard posts, liked posts and user posts by type, reblog status (original or reblog), popularity, recentness, tag or by date
+ Filter and search through tumblelogs you're following, order alphabetically or by how recently they were updated
+ Claim your data: Download and cache your posts and users you are following
+ Tumblr client-side data (primarily Backbone models and collections) are used where possible to benefit from improved performance and richer data over the public api.

## tl:dr

A Chrome extension that adds a new navigation tab and dropdown that allows you to fetch posts of a certain type, from a certain user or search for posts from a specific user by tag.

## The idea

+ Create new components by aggregating Tumblr features that are often over looked or have a silly implementation (indash blogs) or complicated UI (in dash post filter filter options are hidden until a search term is entered... why?) or are arbitrarily disabled (there is a perfectly functional NSFW filter that I can't otherwise figure out how to enable) into a functional component.
+ Create tools, mixins, etc. to make developing Backbone components using Tumblr code easier.
+ Leverage es6 + es7 features while maintaining a code style consistent with Tumblr's code base

## Note

This is liable to break as Tumblr updates and is not by any means official or fully supported by me. This is pretty much an experiment in using the objects floating around the Tumblr window to try and make new components using Tumblr's custom Backbone code.

## Relevant development posts

1. http://seveneyedfox.tumblr.com/post/142342782841/tumblr-notes-pt-1
2. http://seveneyedfox.tumblr.com/post/142392103991/tumblr-notes-pt-2
3. http://seveneyedfox.tumblr.com/post/142476902926/tumblr-notes-pt-3
4. http://seveneyedfox.tumblr.com/post/142659709101/tumblr-notesthotz-pt-4
5. http://seveneyedfox.tumblr.com/post/143001544861/tumblr-notes-pt-5

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
