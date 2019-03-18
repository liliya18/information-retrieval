const fs = require('fs');
const natural = require('natural');

const indexFilePath = 'TfIdf/resources/index.txt';

const search = query => {
    const documentsVector = getDocumentsVector();
    const queryVector = getQueryVector(query);
    const cosineSimilarity = {};
    Object.values(documentsVector).slice(0, -1).forEach((vector, i) => {
        cosineSimilarity[getLink(i)] = calculateCosineSimilarity(queryVector, vector);
    });

    const links = Object.keys(cosineSimilarity);
    links.sort((a, b) => {
        return cosineSimilarity[a] - cosineSimilarity[b]
    });

    console.log(links.reverse());
};

const getDocumentsVector = () => {
    const documentsVector = {};

    const indexFileContent = fs.readFileSync(indexFilePath, 'utf8');
    const lines = indexFileContent.split('\n');
    lines.forEach((line, i) => {
        const wordsLineArray = line.split('\t');
        const wordsLine = wordsLineArray[1] && wordsLineArray[1].split(' ');
        if (wordsLine !== undefined) {
            wordsLine.forEach((item, i) => {
                if (!documentsVector[i]) {
                    documentsVector[i] = [];
                }
                documentsVector[i].push(item);
            });
        }
    });

    return documentsVector;
};

const getQueryTfIdf = (tfIdfWord, query) => {
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();

    let wordTfIdf = 0;

    tfidf.addDocument(query);
    query.split(' ').map(tfIdfWord => {
        tfidf.tfidfs(tfIdfWord, (i, measure) => {
            wordTfIdf = measure;
        });
    });

    return wordTfIdf;
};

const getQueryVector = query => {
    const queryArray = query.split(' ');
    const stemmingQuery = queryArray.map(query => {
        return natural.PorterStemmerRu.stem(query);
    });

    const indexFileContent = fs.readFileSync(indexFilePath, 'utf8');
    const lines = indexFileContent.split('\n');
    const vector = [];
    const words = [];

    lines.forEach((line, i) => {
        const wordsLineArray = line.split('\t');
        const word = wordsLineArray[0];
        words.push(word);
    });

    words.map(word => {
        if (stemmingQuery.includes(word)) {
            const tfIdf = getQueryTfIdf(word, query);
            vector.push(tfIdf);
        } else {
            vector.push(0);
        }
    });

    return vector;
};

const calculateCosineSimilarity = (vectorA, vectorB) => {
    const dimensionality = Math.min(vectorA.length, vectorB.length);
    let dotAB = 0;
    let dotA = 0;
    let dotB = 0;
    let dimension = 0;
    while (dimension < dimensionality) {
        const componentA = vectorA[dimension];
        const componentB = vectorB[dimension];
        dotAB += componentA * componentB;
        dotA += componentA * componentA;
        dotB += componentB * componentB;
        dimension += 1;
    }

    const magnitude = Math.sqrt(dotA * dotB);

    return magnitude === 0 ? 0 : dotAB / magnitude;
};

const getLink = (number) => {
    const linksFilePath = './TextPreprocessing/resources/crawler/index.txt'

    let link = '';
    const linksFileContent = fs.readFileSync(linksFilePath, 'utf8');
    const lines = linksFileContent.split('\n');
    lines.forEach((line, i) => {
        if (number === i) {
            link = line;
        }
    });

    return link;
};

module.exports = search;
