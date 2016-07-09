const parseFile = (file, callback) => {
  const fileSize = file.size;
  let chunkSize = (64 * 1024); // bytes
  let offset = 0;
  let chunkReaderBlock = null;

  const readEventHandler = e => {
    if (e.target.error) {
      return;
    }
    offset += chunkSize;
    Backbone.Events.trigger('CREATING_FILE_BLOB', {
      offset,
      fileSize
    });
    callback({
      fileFragment: e.target.result,
      fileSize,
      offset
    });
    if (chunkSize === 0) {
      Backbone.Events.trigger('DONE_CREATING_BLOB');
      return;
    }
    if (offset + chunkSize > fileSize) {
      chunkSize = fileSize - offset;
    }
    if (chunkSize <= 0) { // allows one more pass so that backend can detect when the stream is done
      chunkSize = 0;
    }
    // callback for handling read chunk
    // off to the next chunk
    chunkReaderBlock(offset, chunkSize, file);
  };

  chunkReaderBlock = (_offset, length, _file) => {
    const r = new FileReader();
    const blob = _file.slice(_offset, length + _offset);
    r.onload = readEventHandler;
    r.readAsText(blob);
  };
  // now let's start the read with the first block
  chunkReaderBlock(offset, chunkSize, file);
};

export default parseFile;
