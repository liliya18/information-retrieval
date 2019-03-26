const request = require('sync-request');
const fs = require('fs');
const cheerio = require('cheerio');
const urlParser = require('url-parse');

const indexFilePath = 'TextPreprocessing/resources/crawler/index.txt';
const pageRankIndexFilePath = 'PageRank/resources/index.json';
const pageRankIndexFilePathWithLinks = 'PageRank/resources/indexLinks.json';

let baseUrl;
const links = {};

const pageRank = () => {
    // getLinksInPages();

    const pageRank = calculatePageRank();
    const pageRankWithLinks = replaceDocumentNumberByLink(pageRank);
    fs.writeFile(pageRankIndexFilePathWithLinks, JSON.stringify(pageRankWithLinks), 'utf8', (error, file) => {
        if (error) throw error;
    });
};

const getLinksInPages = () => {
    const url = new urlParser('https://ria.ru/');
    baseUrl = url.protocol + "//" + url.hostname;

    const indexFileContent = fs.readFileSync(indexFilePath, 'utf8');
    const lines = indexFileContent.split('\n');
    lines.map(line => {
        if (line === '') return;
        visitPage(line);
    });

    Object.keys(links).map(indexLink => {
        const index = lines.indexOf(indexLink);
        if (index !== -1) {
            links[index] = links[indexLink];
            delete links[indexLink]
        }
    });

    Object.keys(links).map(indexLink => {
        links[indexLink].forEach((link, i) => {
            const index = lines.indexOf(link);
            if (index !== -1) {
                links[indexLink][i] = index;
            }
        });

        links[indexLink] = links[indexLink].filter(item => typeof item !== 'string');
    });

    fs.appendFile(pageRankIndexFilePath, JSON.stringify(links), (error, file) => {
        if (error) throw error;
        console.log('Файл успешно создан!');
    });
};

const visitPage = url => {
    const response = request('GET', url);

    const $ = cheerio.load(response.body);
    links[url] = collectInternalLinks($);

    return links;
};

const collectInternalLinks = ($) => {
    const relativeLinks = $('a[href^="/"]');
    let links = [];
    relativeLinks.each(function () {
        links.push(baseUrl + $(this).attr('href'));
    });

    return links;
};

const getPagesWithCurrentLink = (pageRankList, documentNumber) => {
    return Object.keys(pageRankList).filter(linkNumber => {
        return pageRankList[linkNumber].includes(parseInt(documentNumber));
    });
};

const calculatePageRank = () => {
    const pageRankList = JSON.parse(fs.readFileSync(pageRankIndexFilePath, 'utf8'));
    const coefficient = 0.85;
    let iterateCount = 500;

    const index = {};

    while (iterateCount) {
        Object.keys(pageRankList).map(documentNumber => {
            const links = getPagesWithCurrentLink(pageRankList, parseInt(documentNumber));
            const items = links.map(link => {
                if (!index[link]) index[link] = 1;
                return index[link] / pageRankList[link].length;
            });

            let sum = 0;
            if (items.length) sum = items.reduce((a, b) => {
                return a + b;
            });

            index[documentNumber] = (1 - coefficient) / 100 + coefficient * sum;
        });

        iterateCount--;
    }

    return index;
};

const replaceDocumentNumberByLink = (index) => {
    Object.keys(index).map(documentNumber => {
        const linksFilePath = './TextPreprocessing/resources/crawler/index.txt';

        let link = '';
        const linksFileContent = fs.readFileSync(linksFilePath, 'utf8');
        const lines = linksFileContent.split('\n');
        lines.forEach((line, i) => {
            if (parseInt(documentNumber) === i) {
                link = line;
            }
        });

        index[link] = index[documentNumber];
        delete index[documentNumber];
    });

    return index;
};

module.exports = pageRank;