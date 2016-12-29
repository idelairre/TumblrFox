const noopCallback = callback => {
  if (callback) {
    callback();
  }
}

export default noopCallback;
