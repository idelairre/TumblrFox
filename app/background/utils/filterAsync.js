// TODO: split this up into other files

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const filter = num => wait(1).then(() => num === 3);

const filterAsync = (array, filter) => Promise.all(array.map(filter)).then(bits => array.filter(entry => bits.shift()));

export default filterAsync;
