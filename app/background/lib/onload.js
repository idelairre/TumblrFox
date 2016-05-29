/* global window:true */
/* eslint no-undef: "error" */

import { ChromeExOAuth } from './chromeExOauth';

// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

window.onload = () => {
  ChromeExOAuth.initCallbackPage();
};
