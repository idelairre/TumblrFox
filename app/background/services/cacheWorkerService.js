import { has } from 'lodash';
import 'operative';

const CacheWorker = operative({
  fileBlob: '',
  assembleFile({ fileFragment, offset, fileSize }) {
    const deferred = this.deferred();
    if (fileFragment.length === 0) {
      console.log('[DONE ASSEMBLING FILE]');
      deferred.fulfill(this.fileBlob);
    }
    if (!this.fileBlob.includes(fileFragment)) {
      this.fileBlob += fileFragment;
      console.log(`[ASSEMBLING FILE]: ${offset} out of ${fileSize}`);
    }
  },
  convertJsonToCsv(jsonData) {
    const deferred = this.deferred();
    try {
      let csv = '';
      const headers = [];
      for (let i = 0; jsonData.length > i; i += 1) {
        const item = jsonData[i];
        Object.keys(item).map(key => {
          if (!headers.includes(key)) {
            headers.push(key);
          }
        });
      }
      const row = headers.join('Ꮂ').replace(/[\[\]']+/g, '');
      csv += `${row}\r\n`; // append Label row with line break
      for (let i = 0; i < jsonData.length; i += 1) { // 1st loop is to extract each row
        let row = [];
        for (const key in jsonData[i]) { // 2nd loop will extract each column and convert it in string comma-seprated
          if (has(jsonData[i], key)) {
            row[headers.indexOf(key)] = `${JSON.stringify(jsonData[i][key])}`;
          }
        }
        row = row.join('Ꮂ');
        csv += `${row}\r\n`; // add a line break after each row
      }
      deferred.fulfill({
        type: 'csv',
        file: csv
      });
    } catch (e) {
      deferred.reject(e);
    }
  },
  assembleFileBlob({ file, type }) {
    console.log('[ASSEMBLING FILE BLOB]');
    const deferred = this.deferred();
    try {
      if (typeof type === 'undefined') { // defaults to csv
        type = 'csv';
      }
      if (type === 'json') {
        file.map(post => {
          post.html = post.html.replace(/"/g, '\\"');
        });
        file = JSON.stringify(file, null, '\t');
      }
      const url = URL.createObjectURL(new Blob([file], {
        type: `application/${type},charset=utf-8`
      }));
      deferred.fulfill(url);
    } catch (e) {
      deferred.reject(e);
    }
  },
  parsePosts(posts, callback) {
    const deferred = this.deferred();
    try {
      const parsedPosts = JSON.parse(posts);
      deferred.resolve(parsedPosts);
    } catch (e) {
      deferred.reject(e);
    }
  }
});

export default CacheWorker;
