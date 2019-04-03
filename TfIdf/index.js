const fs = require('fs');
const natural = require('natural');

const directoryPath = './TextPreprocessing/resources/stemming/pages/';
const indexFilePath = 'TfIdf/resources/index.json';

const documentsCount = 100;

const tfIdf = (query) => {
    const documents = getDocuments();
    const tokens = getTokens(documents);
    const dictionary = getDictionary(tokens);
    const countVectors = getCountVectors(dictionary, tokens);
    const countVectorsT = getCountVectorsT(countVectors);
    const tfVectors = getTfVectors(countVectors);
    const idfVectors = getIdfVectors(countVectors, countVectorsT);
    const tfIdfVectors = getTfIdfVectors(tfVectors, idfVectors);
    const queryCountVector = getQueryCountVector(dictionary, query);
    const queryTfVector = getQueryTfVector(queryCountVector);
    const queryIdfVector = getQueryIdfVector(idfVectors);
    const queryTfIdfVector = getQueryTfIdfVector(queryTfVector, queryIdfVector);
    const cosineSimilarities = getCosineSimilarities(tfIdfVectors, queryTfIdfVector);

    const index = [];
    documents.map((document, i) => {
        index[document.id] = cosineSimilarities[i];
    });

    const result = Object.keys(index).sort(function (a, b) {
        return index[a] - index[b]
    }).reverse();

    console.log(result)
};

const getDocuments = () => {
    let documents = [];

    const files = fs.readdirSync(directoryPath);

    files.map(file => {
        const content = fs.readFileSync(directoryPath + file, 'utf-8').split(/\t/g).filter(word => word.length > 0);
        const id = file.split('.').shift();
        documents.push({
            "id": id,
            "tokens": content
        });
    });

    return documents;
};

const getTokens = documents => {
    return documents.map(document => {
        return document.tokens || [];
    })
};

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

const getCountVectors = (dictionary, words) => {
    return words.map(tokens => {
        return dictionary.map(word => {
            return tokens.reduce((acc, token) => {
                return token === word ? acc + 1 : acc;
            }, 0)
        })
    });
};

const getCountVectorsT = mainCountVectors => {
    let array = [];
    mainCountVectors.map((countVector, row, countVectors) => {
            countVector.map((count, col, countVector) => {
                    if (row === 0) array.push([]);
                    array[col].push(count);
                }
            );
        }
    );
    return array;
};

const getTfVectors = countVectors => {
    return countVectors.map(countVector => {
        return makeTfVector(countVector);
    });
};

const getIdfVectors = (countVectors, countVectorsT) => {
    let total = documentsCount;

    if (total === 0) {
        return countVectors.map(() => {
            return [];
        });
    }

    const idfVector = countVectors[0].map((count, col) => {
        const inDocCount = countVectorsT[col].reduce((acc, x) => {
            return acc + (x > 0 ? 1 : 0);
        }, 0);
        if (total === 0) return 0;
        if (inDocCount === 0) return 0;

        return Math.log(total / inDocCount);
    });
    return countVectors.map(() => {
        return idfVector;
    });
};

const getTfIdfVectors = (tfVectors, idfVectors) => {
    return tfVectors.map((tfVector, row) => {
        return tfVector.map((tf, col) => {
            return tf * idfVectors[row][col];
        });
    });
};

const getQueryCountVector = (dictionary, query) => {
    const queryTokens = query.map(query => natural.PorterStemmerRu.stem(query));

    return dictionary.map(word => {
        return queryTokens.reduce((acc, token) => {
            return token === word ? acc + 1 : acc;
        }, 0);
    });
};

const getQueryTfVector = queryCountVector => makeTfVector(queryCountVector);

const getQueryIdfVector = idfVectors => idfVectors[0];

const getQueryTfIdfVector = (queryTfVector, queryIdfVector) => {
    return queryTfVector.map((tf, index) => {
        return tf * queryIdfVector[index];
    });
};

const getCosineSimilarities = (tfIdfVectors, queryTfIdfVector) => {
    const mag = vector => {
        return Math.sqrt(vector.reduce((acc, el) => {
            return acc + (el * el);
        }, 0));
    };

    const queryMag = mag(queryTfIdfVector);
    return tfIdfVectors.map((tfIdfVector) => {
            const dot = tfIdfVector.reduce((acc, tfIdf, index) => {
                return acc + (tfIdf * queryTfIdfVector[index]);
            }, 0);
            const docMag = mag(tfIdfVector);
            const mags = queryMag * docMag;
            return mags === 0 ? 0 : dot / mags;
        }
    );
};

const sum = array => {
    return array.reduce((acc, x) => {
        return acc + x;
    }, 0);
};

const makeTfVector = countVector => {
    let total = sum(countVector);
    return countVector.map((count) => {
        return total === 0 ? 0 : count / total;
    });
};

const replaceDocumentNumberByLink = result => {
    Object.keys(result).map(documentNumber => {
        const linksFilePath = './TextPreprocessing/resources/crawler/index.txt';

        let link = '';
        const linksFileContent = fs.readFileSync(linksFilePath, 'utf8');
        const lines = linksFileContent.split('\n');
        lines.forEach((line, i) => {
            if (parseInt(documentNumber) === i) {
                link = line;
            }
        });

        result[link] = result[documentNumber];
        delete result[documentNumber];
    });

    return result;
};

module.exports = tfIdf;