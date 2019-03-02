const fs = require('fs');
const natural = require('natural');

const directoryPath = './TextPreprocessing/resources/stemming/pages/';
const indexFilePath = 'TfIdf/resources/index.txt';

const tfIdf = () => {
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();

    const index = {};

    const files = fs.readdirSync(directoryPath);
    files.map(file => {
        const content = fs.readFileSync(directoryPath + file, 'utf-8');
        const words = content.split('\t');
        tfidf.addDocument(content);
        words.forEach((word) => {
            if (!index[word]) {
                index[word] = Array(100).fill(0);
            }
            tfidf.tfidfs(word, (i, measure) => {
                index[word] = Object.assign([], index[word], { [i + 1]: measure });
            });
        });
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

module.exports = tfIdf;