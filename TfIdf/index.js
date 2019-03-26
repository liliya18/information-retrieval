const fs = require('fs');
const natural = require('natural');

const directoryPath = './TextPreprocessing/resources/stemming/pages/';
const indexFilePath = 'TfIdf/resources/index.json';

const documentsCount = 100;

const tfIdf = (query) => {
    const words = getWords();
    const dictionary = getDictionary(words);
    const documentsTfIdf = calculateTfIdf(dictionary);

    // createIndexFile(tfIdf);

    const queryTfIdf = getQueryTfIdf(query, dictionary);

    const documentsTfIdfVector = getDocumentsTfIdfVector(documentsTfIdf);
    const queryTfIdfVector = getQueryTfIdfVector(queryTfIdf);

    const vectorSearchResult = {};

    Object.keys(documentsTfIdfVector).map(document => {
        vectorSearchResult[document] = calculateCosineSimilarity(documentsTfIdfVector[document], queryTfIdfVector);
    });

    const replacedResult = replaceDocumentNumberByLink(vectorSearchResult);
    const result = Object.keys(replacedResult).sort(function (a, b) {
        return replacedResult[a] - replacedResult[b]
    }).reverse();

    console.log(result);
};

/**
 * Запись tfIdf в файл index.json
 * @param content
 */
const createIndexFile = content => {
    fs.writeFile(indexFilePath, JSON.stringify(content), 'utf8', (error, file) => {
        if (error) throw error;
    });
};

/**
 * Получение всех слов во всех документах
 * @returns {string[][]}
 */
const getWords = () => {
    const files = fs.readdirSync(directoryPath);

    return files.map(file => {
        return fs.readFileSync(directoryPath + file, 'utf-8').split('\t');
    });
};

/**
 * Получение словаря
 * @param words
 * @returns {*}
 */
const getDictionary = words => {
    return words
        .reduce((acc, words) => {
            return acc.concat(words);
        }, [])
        .reduce((acc, word) => {
            if (acc.indexOf(word) === -1) {
                acc.push(word);
                return acc;
            } else {
                return acc;
            }
        }, [])
        .filter(word => {
            return word !== '';
        });
};

/**
 * Вычисление TfIdf документов
 * @param dictionary
 */
const calculateTfIdf = dictionary => {
    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();

    const files = fs.readdirSync(directoryPath);

    files.map(file => {
        const content = fs.readFileSync(directoryPath + file, 'utf-8');
        tfidf.addDocument(content);
    });

    const index = {};

    dictionary.map(word => {
        tfidf.tfidfs(word, (i, measure) => {
            if (!index[word]) index[word] = [];
            index[word].push(measure);
        });
    });

    return index;
};

/**
 * Вычисление TfIdf запроса
 * @param query
 * @param dictionary
 */
const getQueryTfIdf = (query, dictionary) => {
    const stemmingQuery = query.map(query => {
        return natural.PorterStemmerRu.stem(query);
    });

    const TfIdf = natural.TfIdf;
    const tfidf = new TfIdf();

    tfidf.addDocument(stemmingQuery);

    const index = {};

    dictionary.map(word => {
        tfidf.tfidfs(word, (i, measure) => {
            if (!index[word]) index[word] = [];
            index[word].push(measure);
        });
    });

    return index;
};

const getDocumentsTfIdfVector = documentsTfIdf => {
    const index = {};

    Object.keys(documentsTfIdf).map(word => {
        for (let i = 0; i < documentsCount; i++) {
            if (!index[i]) index[i] = [];
            index[i].push(documentsTfIdf[word][i]);
        }
    });

    return index;
};

const getQueryTfIdfVector = queryTfIdf => {
    return Object.values(queryTfIdf)
        .reduce((acc, words) => {
            return acc.concat(words);
        }, []);
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

const replaceDocumentNumberByLink = (vectorSearchResults) => {
    Object.keys(vectorSearchResults).map(documentNumber => {
        const linksFilePath = './TextPreprocessing/resources/crawler/index.txt';

        let link = '';
        const linksFileContent = fs.readFileSync(linksFilePath, 'utf8');
        const lines = linksFileContent.split('\n');
        lines.forEach((line, i) => {
            if (parseInt(documentNumber) === i) {
                link = line;
            }
        });

        vectorSearchResults[link] = vectorSearchResults[documentNumber];
        delete vectorSearchResults[documentNumber];
    });

    return vectorSearchResults;
};

module.exports = tfIdf;