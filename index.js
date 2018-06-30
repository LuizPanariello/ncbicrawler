const Crawler = require("crawler");
const fs = require("fs");
const decode = require('safe-decode-uri-component');

let authors = fs.readFileSync('./authors.csv', 'utf8').trim().split(/\r?\n/);

let searchs = authors
    .map(author => {
        if(author.trim() !== ''){
            return `https://www.ncbi.nlm.nih.gov/pubmed/?term=${author}`;
        }
    });

let index = 0;
let results = [];

const clearUrl = (url) => {
    return decode(url.replace('https://www.ncbi.nlm.nih.gov/pubmed/?term=', ''));
}

var c = new Crawler({
    maxConnections: 10,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.87 Safari/537.36',
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }else{
            var $ = res.$;

            if($('.auths > a').length > 0){
                let year = $('.cit').text().match(/\b(19|20)\d{2}\b/g)[0];
                let author = $('.auths > a').first().text()
                let postfix = ''; 
                
                if($('.auths > a').length > 1){
                    postfix = ' et al., ';
                } else {
                    postfix = ', ';
                }

                let result = `${author}${postfix}${year}`;

                results.push(`${result}|${clearUrl(res.request.uri.href)}\n`)

            } else {
                results.push(`|${clearUrl(res.request.uri.href)}\n`)
            }
        }

        index ++;
        
        if(searchs.length === index){
            fs.writeFileSync('results.csv', results.join(''));
        }

        done();
    }
});

c.queue(searchs);