const port = 3000
const express = require('express')
const app = express()
const bodyParser = require("body-parser");
const puppeteer = require('puppeteer');
const cors = require('cors')
const fs = require('fs')

/* ----------------------------- LOGGING ----------------------------- */
const logger = require("./util/logger");


app.use(cors())
app.use(bodyParser.json({ limit: '500mb' }));
app.use(bodyParser.text({ type: 'text/html', limit: '500mb' }))

/* ----------------------------- REQUEST IDENTIFICATION ----------------------------- */
app.use(function(req, res, next) {  
  req.id = Math.random()
    .toString(36)
    .substr(2);
  res.id = req.id;
  next();
});

app.use(function (error, req, res, next) {
    if (error instanceof SyntaxError) {
        res.header("Content-Type", "application/json")
        res.status(400);
        res.send('{"error":"Error parsing JSON"}');
        logger.info( res.id +" - [Request Ended]")
    } else {       
        next();
    }
});

app.post('/LMEUtils/pdf/generate', function (req, res) {     
    logger.info(req.id+" - [New request]")
    let html = req.body.html;
    simpleprocessPDF(html, res)
});

app.post('/LMEUtils/pdf/generateFromHTML', function (req, res) {     
    logger.info(req.id+" - [New request]")
    let html = req.body
    if (typeof html == "object")
        html = ""
    simpleprocessPDF(html, res, req.headers.landscape)
});

app.get('/LMEUtils/pdf/api', function (req, res) {
    fs.readFile('./info.html', function (err, data) {
        res.header('Content-Type', 'text/html; charset=utf8')
        res.status(200)
        res.end(data)
    });
});

app.listen(port, () => {
    logger.info("<--------------------------------->")
    logger.info("  PDF Generator API")
    logger.info("  Server listening on port: ", port)
    logger.info("<--------------------------------->")
})

function simpleprocessPDF(html, res, landscape) {
    const { id } = res;
    getBrowserPage().then(page => {
        if (html.length != 0) {
            logger.info(id+" -- [Processing HTML] - size(" + formatByteSize(lengthInUtf8Bytes(html)) + ") ")
            page.setJavaScriptEnabled(false).then(() => {
                page.goto(`data:text/html,${html}`, { waitUntil: 'networkidle2' }).then(() => {
                    page.pdf({ format: 'A4', margin: 0, landscape: landscape == 'true' ? true : false }).then(
                        e => {
                            logger.info(id+" -- [PDF generated]")
                            res.header("Content-Type", "application/pdf")
                            res.send(e)
                            page.browser().close()
                            logger.info(id+" - [Request Ended]")
                        }
                    ).catch(r => {
                        page.browser().close()
                        logger.error(id + " -- " +r)
                        res.header("Content-Type", "application/json")
                        res.status(400);
                        res.send('{"error":"puppeter - Failed creating PDF","msg":"' + r + '"}');
                        logger.info(id+" - [Request Ended]")
                    })
                }).catch(error => {
                    page.browser().close()
                    logger.error(id + " -- " +error)
                    res.header("Content-Type", "application/json")
                    res.status(400);
                    res.send('{"error":"puppeter - Failed setting content","msg":"' + error + '"}');
                    logger.info(id+" - [Request Ended]")
                })
            })
        } else {
            page.browser().close()
            res.header("Content-Type", "application/json")
            res.status(400);
            res.send('{"error":"Empty HTML"}');
            logger.info(id+" - [Request Ended]")
        }
    }).catch(error => {
        logger.error(id + " -- " +error)
        res.header("Content-Type", "application/json")
        res.status(400);
        res.send('{"error":"puppeter - Failed launching Chromium","msg":"' + error + '"}');
        logger.info(id+" - [Request Ended]")
    });
}

function getBrowserPage() {
    return new Promise(function (resolve, reject) {
        puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox', '--allow-file-access-from-files', '--enable-local-file-accesses'] })
            .then(browser => {
                browser.newPage().then(page => {
                    page.on('error', error => {
                        reject(error)
                    })
                    resolve(page)
                })
            }).catch(error => {
                reject(error)
            })
    })
}

function lengthInUtf8Bytes(str) {
    var m = encodeURIComponent(str).match(/%[89ABab]/g);
    return str.length + (m ? m.length : 0);
}

function formatByteSize(bytes) {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB";
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB";
    else return (bytes / 1073741824).toFixed(3) + " GiB";
}