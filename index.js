//------------------------------- Library imports ------------------------------
const express = require('express');
const app = express();
const admin = express();
const basicAuth = require('express-basic-auth')

const bodyParser = require("body-parser");

const path = require('path');

const fs = require('fs');

const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

require('dotenv').config();

client.on('connect', () => console.log('Connected to Redis'));
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();


//--------------------------------- Functions ----------------------------------

function genString(len) {
    const charset = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let output = '';
    for (let i = 0; i < len; ++i) {
        output += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return output;
}

function fileTree(folder) {
  var result = [];
  var plist = [folder];

  while (plist.length > 0){
    var curf = plist.pop();
    var curstat = fs.statSync(curf);

    if (curstat.isDirectory()) {
      var files = fs.readdirSync(curf);
      files.forEach((element) => {
        plist.push(curf + "/" + element);
      });
    }
    else {
      result.push(curf);
    }
  }
  return result;
}


//-------------------------------- App functions -------------------------------

var app_files = fileTree("frontend");
var app_data = {};

app_files.forEach((element) => {
  app_data[element.substring(8)] = fs.readFileSync(element);
});

console.log(app_data);

app.get('/*', function(req, res) {
  if (app_data[req.originalUrl]){
    res.send(app_data[req.originalUrl]);
  }

  else {
    res.send(app_data["/404.html"].toString());
  }
  //res.sendFile(path.join(__dirname, 'frontend/secret.html'));
});

//app.use(express.static('frontend'));
//
//app.get('/secret/*', function(req, res) {
//  res.sendFile(path.join(__dirname, 'frontend/secret.html'));
//});
//
//app.get('/api/secret/*', function(req, res) {
//	(async () => {
//		var secret = await client.get("secret." + req.originalUrl.split("/")[3]);
//		if(!secret) {
//			res.send("ERROR: Invalid or deleted key");
//		} else {
//			await client.del("secret." + req.originalUrl.split("/")[3]);
//			await client.del("timestamp." + req.originalUrl.split("/")[3]);
//			res.send(secret);
//		}
//	})();
//});


//------------------------------- Admin functions ------------------------------

admin.use(bodyParser.json());
admin.use(bodyParser.urlencoded({ extended: false }));

admin.use(basicAuth({
    users: { admin: 'admin' },
    challenge: true
}));

admin.use(express.static('frontend'));
admin.use('/admin', express.static('admin'))

admin.get('/admin/keys', function(req, res) {
        (async () => {
		var out = {};
                keys = await client.keys("secret.*");
		for (let i = 0; i < keys.length; i++) {
			out[keys[i]] = await client.get("timestamp." + keys[i].substring(7))
		}
		res.send(JSON.stringify(out));
	})();
});

admin.post('/admin/create', (req, res) => {
        (async () => {
                var message = req.body;
                var id = genString(32);
                await client.set("secret." + id, message.value);
                await client.set("timestamp." + id, Date.now());
                res.sendStatus(200);
        })();
});


//--------------------------- Post declarative startup -------------------------

app.listen(parseInt(process.env.APP_PORT), () => {
  console.log("App listening at " + process.env.APP_PREPEND);
});

admin.listen(parseInt(process.env.ADMIN_PORT), () => {
  console.log("Admin listening at " + process.env.APP_PREPEND + "/admin");
});
