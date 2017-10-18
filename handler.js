'use strict';
const httservp = require("http");
const cheerio = require('cheerio');
const key = require('./key.json');
const google = require('googleapis');
const sheets = google.sheets('v4');
var request = require('request');
var request = request.defaults({jar: true, followAllRedirects: true});

var jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ['https://www.googleapis.com/auth/spreadsheets'],
  null
);

function getTimestamp(){
  const currentdate = new Date();
  const datetime = ( '0' + currentdate.getDate()).slice(-2) + "." +
  ('0' + (currentdate.getMonth()+1)).slice(-2) + " " +
  ('0' + currentdate.getHours()).slice(-2) + ":" +
  ('0' + currentdate.getMinutes()).slice(-2) + ":" +
  ('0' + currentdate.getSeconds()).slice(-2);
  return datetime;
}

function exportData(){
  scrapeData().then((timeValues) => {
    jwtClient.authorize(function (err, tokens) {
      if (err) {
        return(err);
      }
      timeValues.unshift(getTimestamp());
      sheets.spreadsheets.values.append({
        auth: jwtClient,
        spreadsheetId: process.env.SPREADSHEET_ID,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        range: 'Sheet1',
        resource: {
          values: [
            timeValues
          ]
        }
      });
    });
  });
  return "Success"; 
};

function getWebsitesList(htmlBody){
  var $ = cheerio.load(htmlBody);
  const links = [];
  $('.dropdown__list').children().each(function(i, elem) {
    links.push($(this).attr('href'));
  });
  return links;
}

function getTimestamp(){
  const currentdate = new Date();
  const datetime = ( '0' + currentdate.getDate()).slice(-2) + "." +
  ('0' + (currentdate.getMonth()+1)).slice(-2) + " " +
  ('0' + currentdate.getHours()).slice(-2) + ":" +
  ('0' + currentdate.getMinutes()).slice(-2) + ":" +
  ('0' + currentdate.getSeconds()).slice(-2);
  return datetime;
}

function getAllTimes(pagesList, jar, callback){
  const finalArray = pagesList;
  var pageCounter = 0;
  for(let i = 0; i < pagesList.length; i++){
    const url = 'https://calibreapp.com' + pagesList[i] + '/metrics/visually_complete.json?page=home';
    request.get({url: url, jar: jar}, function(err, res, body){
      if(err){
        return console.error(err);
      }
      let obj = JSON.parse(body);
      const pageName = obj.siteId;
      var timeInMs = '-';
      if(obj['history'].length > 0) {
        timeInMs = obj['history'][0]['current'];
      }
      pageCounter += 1;
      finalArray[i] = [finalArray[i].substring(9), timeInMs];
      if(pageCounter == pagesList.length){
        callback(finalArray);
      }
    });
  }
}

const j = request.jar();
function scrapeData(){
  return new Promise((resolve, reject) => {
    request.get({url: 'https://calibreapp.com/sign-in', jar: j}, function(err, response, html) {
      if(!err) {
        var $ = cheerio.load(html);
        const token = $("input[name=authenticity_token]").val();
        request.post({
          url: 'https://calibreapp.com/sessions',
          headers: {
            'origin' : 'https://calibreapp.com',
            'cache-control' : 'max-age=0',
            'connection' : 'keep-alive',
            'content-type' : 'application/x-www-form-urlencoded',
            'referer' : 'https://calibreapp.com/sign-in'
          },
          form: {
            authenticity_token: token,
            email: process.env.CALIBRE_MAIL,
            password: process.env.CALIBRE_PASSWORD,
            remember: 'off'
          },
          jar: j
        }, function(err, resp, body){
            if(err) {
              reject(console.log(err));
            };
            const pagesList = getWebsitesList(body);
            getAllTimes(pagesList, j, function(resultList){
              let values = resultList.map(function(value,index) { return value[1]; })
              resolve(values);
            });
          });
      }
    });
  });
}


module.exports.scrape = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: exportData()
    }),
  };

  callback(null, response);
};