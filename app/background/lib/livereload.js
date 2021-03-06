/* global window:true */
/* global WebSocket:true */
/* global __ENV__:true */
/* eslint no-undef: "error" */

if (__ENV__ === 'development' || __ENV__ === 'test') {
  (() => {
    const LIVERELOAD_HOST = 'localhost';
    const LIVERELOAD_PORT = 35729;
    const connection = new WebSocket(`ws://${LIVERELOAD_HOST}:${LIVERELOAD_PORT}/livereload`);

    connection.onerror = error => {
      console.error('reload connection got error:', error);
    };

    connection.onmessage = e => {
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
