const request = require('sync-request');
const fs = require('fs');
const cheerio = require('cheerio');
const urlParser = require('url-parse');

const indexFilePath = 'TextPreprocessing/resources/crawler/index.txt';
const pageRankIndexFilePath = 'PageRank/resources/index.txt';

let baseUrl;
const links = {};

const pageRank = () => {
    const url = new urlParser('https://ria.ru/');
    baseUrl = url.protocol + "//" + url.hostname;

    const indexFileContent = fs.readFileSync(indexFilePath, 'utf8');
    const lines = indexFileContent.split('\n').slice(0, -1);
    lines.map(line => {
        visitPage(line);
    });

    Object.keys(links).map(indexLink => {
        const index = lines.indexOf(indexLink);
        if (index !== -1) {
            links[index + 1] = links[indexLink];
            delete links[indexLink]
        }
    });

    Object.keys(links).map(indexLink => {
        links[indexLink].forEach((link, i) => {
            const index = lines.indexOf(link);
            if (index !== -1) {
                links[indexLink][i] = index + 1;
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

module.exports = pageRank;