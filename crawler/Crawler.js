const request = require('request');
const fs = require('fs');
const cheerio = require('cheerio');
const urlParser = require('url-parse');

module.exports = function Crawler (URL, maxPagesToVisit) {
    const indexFile = 'crawler/resources/index.txt';
    const textsPath = 'crawler/resources/texts';

    let pagesToVisit = [];
    let pagesVisited = {};
    let visitedPagesCount = 0;
    let url = new urlParser(URL);
    let baseUrl = url.protocol + "//" + url.hostname;

    pagesToVisit.push(URL);

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
                callback();
                return;
            }

            const $ = cheerio.load(body),
                $body = $(body);

            saveLink(url)
            saveText(visitedPagesCount, $body)
            collectInternalLinks($);
            callback();
        });
    }

    const saveLink = (url) => {
        let link = url + '\n';
        fs.appendFile(indexFile, link, (err, file) => {
            if (err) throw err;
            console.log(`Добавлена ссылка ${url}`);
        });
    }

    const saveText = (name, $body) => {
        let text = $body.text().replace(/\s+/g, ' ');
        fs.appendFile(`${textsPath}/${name}.txt`, text, (err, file) => {
            if (err) throw err;
            console.log(`Создан файл ${name}.txt`);
        });
    }

    const collectInternalLinks = ($) => {
        const relativeLinks = $('a[href^="/"]');
        relativeLinks.each(function () {
            let url = baseUrl + $(this).attr('href');
            pagesToVisit.push(url);
        });
    }

    crawl();
}