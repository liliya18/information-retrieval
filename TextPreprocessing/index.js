const request = require('request');
const fs = require('fs');
const cheerio = require('cheerio');
const urlParser = require('url-parse');
const natural = require('natural');

const indexFilePath = 'TextPreprocessing/resources/crawler/index.txt';
const crawlerTextsFolderPath = 'TextPreprocessing/resources/crawler/pages';
const stemmingTextsFolderPath = 'TextPreprocessing/resources/stemming/pages';

const maxPagesToVisit = 100;

let pagesToVisit = [];
let pagesVisited = {};
let visitedPagesCount = 0;

let baseUrl;

const crawler = (URL) => {
    const url = new urlParser(URL);
    baseUrl = url.protocol + "//" + url.hostname;
    pagesToVisit.push(URL);

    crawl();
}

const crawl = () => {
    if (visitedPagesCount >= maxPagesToVisit) {
        return;
    }
    const nextPage = pagesToVisit.pop();

    if (nextPage in pagesVisited) {
        crawl();
    } else {
        visitPage(nextPage, crawl);
    }
}

const visitPage = (url, callback) => {
    pagesVisited[url] = true;
    visitedPagesCount++;

    console.log('Открываем страницу ' + url);
    request(url, (error, response, body) => {
        console.log('Код ответа: ' + response.statusCode);
        if (response.statusCode !== 200) {
            visitedPagesCount--;
            callback();
            return;
        }

        const $ = cheerio.load(body);
        const text = $('div, span, p, h1, h2, h3, h4, h5, h6, strong, b, em').contents().map(function () {
            return (this.type === 'text') ? $(this).text() + ' ' : '';
        }).get().join('');

        saveLink(url)
        saveText(visitedPagesCount, text)
        collectInternalLinks($);
        callback();
    });
}

const saveLink = (url) => {
    const link = url + '\n';
    fs.appendFile(indexFilePath, link, (error, file) => {
        if (error) throw error;
        console.log(`Добавлена ссылка ${url}`);
    });
}

const saveText = (name, text) => {
    const trimmedText = text.replace(/\s\s+/g, ' ').replace(/\d/g, '').replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    fs.appendFile(`${crawlerTextsFolderPath}/${name}.txt`, trimmedText, (error, file) => {
        if (error) throw error;
        console.log(`Создан файл ${name}.txt`);
    });

    const textArray = trimmedText.split(' ');
    textArray.map(value => {
        let stemmingWord = natural.PorterStemmerRu.stem(value);
        stemmingWord = `${stemmingWord}\t`;
        fs.appendFile(`${stemmingTextsFolderPath}/${name}.txt`, stemmingWord, (error, file) => {
            if (error) throw error;
        });
    })
}

const collectInternalLinks = ($) => {
    const relativeLinks = $('a[href^="/"]');
    relativeLinks.each(function () {
        const url = baseUrl + $(this).attr('href');
        pagesToVisit.push(url);
    });
}

module.exports = crawler;