// const crawler = require('./TextPreprocessing/index');
// const init = crawler('https://ria.ru/');

// const invertedIndex = require('./InvertedIndex/index.js');
// const init = invertedIndex();

// const booleanSearch = require('./BooleanSearch/index.js');
// const args = process.argv.slice(2);
// const init = booleanSearch(args);

// const tfIdf = require('./TfIdf/index.js');
// const init = tfIdf();

// const search = require('./Search/index.js');
// const args = process.argv.slice(2);
// const init = search(args);

const pageRank = require('./PageRank/index.js');
const init = pageRank();