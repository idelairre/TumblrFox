/* global window:true */
/* global WebSocket:true */
/* global __ENV__:true */
/* eslint no-undef: "error" */

if (__ENV__ === 'development') {
  (() => {
    const LIVERELOAD_HOST = 'localhost';
    const LIVERELOAD_PORT = 35729;
    const connection = new WebSocket(`ws://${LIVERELOAD_HOST}:${LIVERELOAD_PORT}/livereload`);

    connection.onerror = function (error) {
      console.error('reload connection got error:', error);
    };

    connection.onmessage = function (e) {
      if (e.data) {
        const data = JSON.parse(e.data);
        if (data && data.command === 'reload') {
          window.location.reload();
        }
      }
    };
    console.log('%cLivereload: enabled', 'color: gray');
  })();
}
