const http = require('follow-redirects').http;
const https = require('follow-redirects').https;
const url = require('url');
const requesto = require('request');
const fs = require('fs');
const tmp = require('tmp');
const findInFiles = require('find-in-files');
const mysql = require('mysql');

var con = mysql.createConnection({ //create db connection
  host: "localhost",
  user: "*****",
  password: "*****",
  database: "*****"
});

con.connect(function(err) { //connect to db
  if (err) throw err;
  console.log('Connected to DB');
});


//initial request comes from website
http.createServer(function (req, res) {
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query.rUrl;
  console.log('New request: '+query);

//check if it starts with http or not
  var check = query.substring(0,4);
  if (check == 'http') {var urla = query;}
  else {var urla = 'http://' + query;}

  scrape(urla, '1');

  res.statusCode === 200;
  res.setHeader('Content-type', 'text/html');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end();

}).listen(8000);

//creates a temporary file

function scrape (urla, doneid) {
  var directory = '/Users/joshgrime/Desktop/indexpull/tmp';
  tmp.file({ mode: 0644, prefix: 'body-', postfix: '.txt' , dir: directory},function _tempFileCreated(err, path, fd) {
  if (err) throw err;
  else {
  finder (urla, path, doneid);}});
}

function finder (urla, ultimatePath, doneid) {
  console.log('Sending request to '+urla+' and writing file to '+ultimatePath);
  var header = {headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36'}};
  var stealthBoy = requesto(urla, header).pipe(fs.createWriteStream(ultimatePath)); //this request gets the soure code and pipes it into the temporary file
  stealthBoy.on('finish', function () {fileSizeCheck (sherlock, ultimatePath, urla, doneid);});
}

//if size gets too big the scan struggles, so check it
function fileSizeCheck (sherlock, ultimatePath, urla, doneid) {
var stats = fs.statSync(ultimatePath)
var fileSizeInBytes = stats.size
console.log('File size is: '+fileSizeInBytes);
if (fileSizeInBytes >= 200000) {
console.log('Too big, deleting file');

  var today = new Date();
  var day = today.getDate();
  var month = today.getMonth();
  var year = today.getFullYear();
  var hour = today.getHours();
  var minute = today.getMinutes();
  var second = today.getSeconds();

  var date = year+'-'+month+'-'+day;
  var time = hour+':'+minute+':'+second;

  donePile (date, time, urla, 'LargeFile', deletePile, '0', doneid); //add this URL to completed table
  fs.unlinkSync(ultimatePath); //delete the temp file
}
else {
console.log('Continuing process...');
sherlock(ultimatePath, urla, doneid); //file size passed check so continue
}
}

//this function searches for http links in the file
function sherlock (ultimatePath, urla, doneid) {
 console.log('Hit Sherlock, '+ultimatePath+', '+urla+', '+doneid);
  var today = new Date();
  var day = today.getDate();
  var month = today.getMonth();
  var year = today.getFullYear();
  var hour = today.getHours();
  var minute = today.getMinutes();
  var second = today.getSeconds();

  var date = year+'-'+month+'-'+day;
  var time = hour+':'+minute+':'+second;

  var filedir = '/Users/****/tmp/';
  var filedirs = ultimatePath.substring(39);
  var hyperlinks = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;
  var trash = new RegExp (/^.*\.(jpg|JPG|jpeg|gif|GIF|doc|DOC|pdf|PDF|js|css|php|png|ico)$/); //ignore these file extensions
  var title = '';

findInFiles.find(hyperlinks, filedir, filedirs).then(function(results) { //find urls
        for (var result in results) {
            var res = results[result];
        }
        var urlbs = [];
        for (i=0;i<res.count;i++) {
          var line = res.matches[i];
          var guillotine = trash.test(line); //check file extensions
          var percent = /%/.test(line);
          if (guillotine === true || percent === true) {
            //do nothing
          }
          else {
          urlbs.push(line); //passed check, add to found URLs array
        }
      }
console.log('Found '+(urlbs.length)+' usable file(s) out of '+(res.count)+' found.');
    var uniq = urlbs.reduce(function(a,b){ //get rid of duplicates
    if (a.indexOf(b) < 0 ) a.push(b);
    return a;
    },[]);
    var found = uniq.length;
    console.log('Deduplicated, reduced from '+(urlbs.length)+' to '+found+' links.');
    titleFind (filedir, filedirs, uniq, ultimatePath, urla, found, doneid);
  });
}

function titleFind (filedir, filedirs, uniq, ultimatePath, urla, found, doneid) {
var titleEx = /<title>(.*?)<\/title>/;

  findInFiles.find(titleEx, filedir, filedirs).then(function(results) { //find the title of the searched page
    if (results[0] == null) {
      console.log('No title found');
      theArchitecht('No_Title', uniq, ultimatePath, urla, found, doneid);}
      else {
    for (var result in results) {
        var res = results[result];
    }
    var title1 = (res.matches[0]);
    var title = title1.slice(7,-8);
    console.log('Found title: ' +title);
    theArchitecht(title, uniq, ultimatePath, urla, found, doneid);
}});}

function theArchitecht (title, uniq, ultimatePath, urla, found, doneid) {

//create queries to db

var today = new Date();
var day = today.getDate();
var month = today.getMonth();
var year = today.getFullYear();
var hour = today.getHours();
var minute = today.getMinutes();
var second = today.getSeconds();

var date = year+'-'+month+'-'+day;
var time = hour+':'+minute+':'+second;

function sqlWrite (date, time, uniq, title, deletePile, donePile, urla, found, doneid) {
fs.unlinkSync(ultimatePath);
for (i=0;i<uniq.length;i++) { //all the found URLs

var url = uniq[i];

    const entry = { date: date, time: time, url: url, pagename: title, foundOn: urla };
    con.query('INSERT INTO url_pile SET ?', entry, (err, res) => {
      if(err) {console.log('could not insert this time because '+err);}
      else {
      console.log('Link captured, ID:', res.insertId);
    }
    });
}
donePile(date, time, urla, title, deletePile, found, doneid); //put the searched page in the completed table
}

sqlWrite (date, time, uniq, title, deletePile, donePile, urla, found, doneid, ultimatePath);
}

function donePile (date, time, url, title, deletePile, found, doneid) {
  const entry = { date: date, time: time, url: url, pagename: title, found: found };
  con.query('INSERT INTO done_pile SET ?', entry, (err, res) => {
    if(err) nextRow(dedupe);
    else {
    console.log('Last insert ID:', res.insertId);
    deletePile(nextRow, doneid);
  }
  });
}

function deletePile (nextRow, doneid) { //delete searched URL from queue table in db
'DELETE FROM url_pile WHERE eid = '+doneid, (err, result) => {
  if (err) nextRow(dedupe);
  else {
  console.log(`Deleted ${result.affectedRows} row(s), done id was `+doneid);
  nextRow();
}
});
}

function nextRow() { //get a random row from queue table in db
    con.query('SELECT eid FROM url_pile ORDER BY RAND() LIMIT 1', function (err, result, fields) {
      if (err) nextRow(dedupe);
      else {
      var id = (result[0].eid);
      console.log('Next ID is: '+id);
      round2 (id);
    }
    });
}

function round2 (id) { //get the URL
  con.query('SELECT url FROM url_pile WHERE eid = '+id, function (err, result, fields) {
    if (err) nextRow(dedupe);
    else {
    var nextUrl = (result[0].url);
    console.log('Next URL: '+nextUrl);
    scrape(nextUrl, id); //repeat process
  }
  });
}
