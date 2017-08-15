module.exports = Object.freeze({
    LOG_FILE_PATH: "./log.txt",

    // -----ITEMS-----
    // scrape config
    ITEMS_URL: "http://fifa3.gamemeca.com/dic/?&fType=<%=categoryId%>&p=<%=page%>",
    ITEM_DETAIL_URL: "http://fifa3.gamemeca.com/dic/dic.php?seq=",

    // input/ output config
    ITEMS_JSON_FILE_PATH: "./items.json",
    ITEMS_CSV_FILE_PATH: "./items.csv",
    ITEMS_IDS_FILE_PATH: "./itemIds.txt",

    // scrape item details
    ITEM_DETAILS_JSON_FILE_PATH: "./itemDetails.json",
    ITEM_DETAILS_CSV_FILE_PATH: "./itemDetails.csv",
    ITEM_DETAILS_LOG_FILE_PATH: "./itemDetails.log",

    CATEGORY_SETTING: [
        {fType: '1', pages: 1, type: '4-3-3'},
        {fType: '2', pages: 2, type: '4-2-2-2'},
        {fType: '3', pages: 1, type: '4-2-3-1'},
        {fType: '4', pages: 1, type: '4-2-4'},
        {fType: '5', pages: 3, type: '4-1-1-4'},
        {fType: '6', pages: 1, type: '4-1-3-2'},
        {fType: '7', pages: 1, type: '3-4-3'},
        {fType: '8', pages: 1, type: '3-5-2'},
        {fType: '9', pages: 1, type: 'others'}
    ]
});