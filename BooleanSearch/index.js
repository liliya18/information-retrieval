const fs = require('fs');
const natural = require('natural');

const indexFilePath = './InvertedIndex/resources/index.txt';

const booleanSearch = keywords => {
    const index = {};

    const indexFileContent = fs.readFileSync(indexFilePath, 'utf8');
    const lines = indexFileContent.split('\n');
    lines.map(line => {
        const wordsLineArray = line.split('\t');
        const word = wordsLineArray[0];
        const wordsLine = wordsLineArray[1] && wordsLineArray[1].split(' ');
        index[word] = wordsLine;
    });

    const stemmedKeywords = stemKeywords(keywords);

    let result = [];
    stemmedKeywords.map(keyword => {
        if (index[keyword]) {
            index[keyword].forEach((item, index) => {
                if (item === '1') {
                    result.push(index + 1);
                }
            });
        }
    });

    searchResult(result, stemmedKeywords.length);
}

const stemKeywords = keywords => {
    let stemWords = [];
    keywords.map(keyword => {
        stemWords.push(natural.PorterStemmerRu.stem(keyword));
    });
    return stemWords;
}

const searchResult = (array, size) => {
    const count = array =>
        array.reduce((a, b) =>
            Object.assign(a, { [b]: (a[b] || 0) + 1 }), {}
        );

    const duplicates = dict =>
        Object.keys(dict).filter((a) => dict[a] === size);

    const result = duplicates(count(array));
    if (result.length) {
        console.log(result.join(' '));
    } else {
        console.log('Ничего не найдено');
    }
}

module.exports = booleanSearch;