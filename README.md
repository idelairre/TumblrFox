# Tumblr (fox) filter

## What it is

A Chrome extension that adds a new navigation tab that allows you to fetch posts of a certain type, from a certain user or search for posts from a specific user by tag. The idea is to aggregate Tumblr features that are often over looked or have a silly implementation (indash blogs) or complicated UI (in dash post filter filter options are hidden until a search term is entered... why?) or are arbitrarily disabled (there is a perfectly functional NSFW filter that I can't otherwise figure out how to enable) into a functional component.

Tumblr client-side code (primarily Backbone models and collections) are used where possible to benefit from improved performance over the public api.

## Notes

This is liable to break as Tumblr updates and is not by any means official or fully supported by me. This is pretty much an experiment in using the objects floating around the Tumblr window to try and make new components using Tumblr's custom Backbone code.

Basically the app injects a bunch of scripts that expand the Tumblr window object and listens for window events that allow it to make requests and handoff data using chrome extension scripts.

The Tumblr.Fox thing is an arbitrary namespace based off my dumb Tumblr handle that is basically a weird ES5/6-ey looking module pattern which I had to opt for since import syntax does not work with script injection and I had to make ```require``` behave differently by assigning it to the webpackJsonp window object so I could use Tumblr's mixins and components (see dev notes below).

## Relevant dev posts

1. http://seveneyedfox.tumblr.com/post/142342782841/tumblr-notes-pt-1
2. http://seveneyedfox.tumblr.com/post/142392103991/tumblr-notes-pt-2
3. http://seveneyedfox.tumblr.com/post/142476902926/tumblr-notes-pt-3
4. http://seveneyedfox.tumblr.com/post/142659709101/tumblr-notesthotz-pt-4
5. http://seveneyedfox.tumblr.com/post/143001544861/tumblr-notes-pt-5



## Installation

	$ npm install

## Usage

Run `$ gulp --watch` and load the `dist`-directory into chrome.

## Tasks

### Build

	$ gulp


| Option         | Description                                                                                                                                           |
|----------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `--watch`      | Starts a livereload server and watches all assets. <br>To reload the extension on change include `livereload.js` in your bundle.                      |
| `--production` | Minifies all assets                                                                                                                                   |
| `--verbose`    | Log additional data to the console.                                                                                                                   |
| `--vendor`     | Compile the extension for different vendors (chrome, firefox, opera)  Default: chrome                                                                 |
| `--sourcemaps` | Force the creation of sourcemaps. Default: !production                                                                                                |


### Pack

Zips your `dist` directory and saves it in the `packages` directory.

    $ gulp pack --vendor=firefox
