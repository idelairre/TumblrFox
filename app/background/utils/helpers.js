// TODO: split this up into other files

export const noopCallback = callback => {
  if (callback) {
    callback();
  }
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const filter = num => wait(1).then(() => num === 3);

export const filterAsync = (array, filter) => Promise.all(array.map(filter)).then(bits => array.filter(entry => bits.shift()));
