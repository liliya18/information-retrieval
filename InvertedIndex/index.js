const fs = require('fs');

const directoryPath = './TextPreprocessing/resources/stemming/pages/';
const indexFilePath = 'InvertedIndex/resources/index.txt';

const invertedIndex = () => {
    const index = {};

    const files = fs.readdirSync(directoryPath);
    files.forEach(file => {
        const content = fs.readFileSync(directoryPath + file, 'utf-8');
        const fileName = file.split('.')[0];
        const words = content.split('\t');
        words.map(word => {
            if (word === '') {
                return;
            }
            if (!index[word]) {
                index[word] = Array(100).fill(0);
            }
            index[word] = Object.assign([], index[word], { [fileName - 1]: 1 });
        })
    });

    createIndexFile(index);
};

const createIndexFile = content => {
    words = Object.keys(content);
    words.map(word => {
        const row = word + '\t' + content[word].join(' ') + '\n';
        fs.appendFile(indexFilePath, row, 'utf8', (error, file) => {
            if (error) throw error;
        });
    })
}

module.exports = invertedIndex;