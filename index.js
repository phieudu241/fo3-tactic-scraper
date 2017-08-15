"use strict";
var express = require('express');
var fs = require('fs');
var request = require('request');
var requestp = require('request-promise');
var cheerio = require('cheerio');
var _ = require('lodash');
var CONSTANTS = require('./constants');
var UTILS = require('./utils');
var app = express();
var PROXY = '';
//var PROXY = 'http://192.168.78.7:8888';

app.set('port', (process.env.PORT || 5000));

app.use(express.static('public'));

app.get('/test', function (req, res) {
    res.send('Hello');
});

// ------ITEMS-----
app.get('/getTactics', function (req, res) {
    let config = {
        jsonFilePath: CONSTANTS.ITEMS_JSON_FILE_PATH,
        csvFilePath: CONSTANTS.ITEMS_CSV_FILE_PATH,
        categories: CONSTANTS.CATEGORY_SETTING,
        url: CONSTANTS.ITEMS_URL
    };
    scrapeIds(config);
    res.send('Doing....');
});

app.get('/getTacticDetails', function (req, res) {
    scrapeItemDetails();
    res.send('Doing....');
});

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});

async function scrapeIds(config) {
    let allItems = [],
        itemsPerCategory = [],
        items = [],
        numOfPages = 1,
        html;

    // Create json file if it doesn't exist
    fs.appendFileSync(config.jsonFilePath, '');

    for (let catIndex = 0; catIndex < config.categories.length; catIndex++) {
        numOfPages = config.categories[catIndex].pages;
        items = [];
        itemsPerCategory = [];
        for (let i = 1; i <= numOfPages; i++) {
            html = await getItemsHtml(config.url, config.categories[catIndex].fType, i);
            items = parseItemsHtml(html, config.categories[catIndex].fType, config.categories[catIndex].type);
            itemsPerCategory = itemsPerCategory.concat(items);
            allItems = allItems.concat(items);

            // write log
            fs.appendFileSync(CONSTANTS.LOG_FILE_PATH, 'Category:' + config.categories[catIndex].fType + ', page:' + i + ', items:' + items.length + '\r\n');

            // output in console
            console.log('Category:' + config.categories[catIndex].fType + ', page:' + i + ', items:' + items.length);
        }

        // Append items of current category to JSON file
        var itemsStr = fs.readFileSync(config.jsonFilePath).toString();
        var jsonItems = [];
        if (itemsStr != undefined && itemsStr.trim() != '') {
            jsonItems = JSON.parse(itemsStr);
            jsonItems.push(itemsPerCategory);
            fs.writeFileSync(config.jsonFilePath, JSON.stringify(jsonItems));
        }
    }

    // Write JSON file
    fs.writeFileSync(config.jsonFilePath, JSON.stringify(allItems));
    // Write CSV file
    UTILS.convertJSONArrayToCSVFile(allItems, config.csvFilePath);
}

function parseItemsHtml(html, categoryId, type) {
    let items = [];

    if (html) {
        let $ = cheerio.load(html),
            $items = $('.ground_list_n a');

        $items.each((index, el) => {
            items.push({'cat': categoryId, 'seq': $(el).attr('data-seq'), 'type': type});
        });
    }

    return items;
}

async function getItem(itemId, catId) {
    let item = undefined,
        html = await fetchItemWebPage(itemId);

    if (html) {
        item = {item_id: itemId, catId: catId};
        let $ = cheerio.load(html);

        item.director = $('.nametatic1 .tit01').text().trim();
        item.characteristic = $('.nametatic2 .tit01').text().trim();


        let imageUrls =  $('.tatic_list img');
        // Images url
        item.attack_img_url = $(imageUrls[0]).attr('src');
        item.defence_img_url = $(imageUrls[1]).attr('src');
        item.tactic_settings_img_url = $(imageUrls[2]).attr('src');
    }

    return item;
}

async function getItemsHtml(url, categoryId, page) {
    let compiled = _.template(url),
        compiledUrl = compiled({'categoryId': categoryId, 'page': page});

    console.log(compiledUrl);

    try {
        return await requestp.get({
            url: compiledUrl,
            proxy: PROXY
        });
    } catch (err) {
        // Write error log
        fs.appendFileSync(CONSTANTS.LOG_FILE_PATH, 'Category:' + categoryId + ', page:' + page + ', error:' + err);
        return {data: []};
    }
}

async function fetchItemWebPage(itemId) {
    try {
        return await requestp.get({
            url: CONSTANTS.ITEM_DETAIL_URL + itemId,
            proxy: PROXY
        });
    } catch (err) {
        // Write error log
        fs.appendFileSync(CONSTANTS.LOG_FILE_PATH, 'Item ID:' + itemId + ', error:' + err);
        return undefined;
    }
}

async function scrapeItemDetails() {
    let itemsInfo = UTILS.getIdsFromFile(CONSTANTS.ITEMS_IDS_FILE_PATH),
        items = [];

    for (var index = 0; index < itemsInfo.length; index++) {
        console.log('Item: ' + index);
        let itemParts = itemsInfo[index].split('-'),
            itemId = itemParts[0],
            catId = itemParts[1],
            item = await getItem(itemId,catId);

        // write item to JSON file
        if (item) {
            items.push(item);
            UTILS.writeJSON(itemId, item, CONSTANTS.ITEM_DETAILS_JSON_FILE_PATH);
            UTILS.writeLog(CONSTANTS.ITEM_DETAILS_LOG_FILE_PATH, itemId + ': OK');
            console.log('OK: ' + itemId);
        } else {
            UTILS.writeLog(CONSTANTS.ITEM_DETAILS_LOG_FILE_PATH, itemId + ': Error');
            console.log('Error: ' + itemId);
        }
    }

    UTILS.convertJSONArrayToCSVFile(items, CONSTANTS.ITEM_DETAILS_CSV_FILE_PATH);
}