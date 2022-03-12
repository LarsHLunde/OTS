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

var text_filter = {
  html: "text/html",
  js: "application/javascript",
  svg: "image/svg+xml",
  css: "text/css",
  map: "application/json"
}

var replacements_app = [
  {
    key: "APP_PREPEND_MARKER",
    value: process.env.APP_PREPEND,
    files: [
      "/secret.html",
      "/404.html",
      "/js/script-secret.js"
    ]
  },
]

app_files.forEach((element) => {
  if (text_filter[element.split(".").slice(-1).pop()]){
    app_data[element.substring(8)] = fs.readFileSync(element).toString();
  }

  else {
    app_data[element.substring(8)] = fs.readFileSync(element);
  }
});

replacements_app.forEach((rep) => {
  rep["files"].foreEach((file) => {
    app_data["file"].replaceAll(key, value);
  })
})


app.get('/*', function(req, res) {
  if (app_data[req.originalUrl]){
    var data_type = req.originalUrl.split(".").slice(-1).pop()
    if (text_filter[data_type]) {
      res.set("Content-Type", text_filter[data_type]);
    }
    res.send(app_data[req.originalUrl]);
  }

  else if(req.originalUrl.match("/api/secret/")) {
    (async () => {
    	var secret = await client.get("secret." + req.originalUrl.split("/")[3]);
    	if(!secret) {
    		res.send("ERROR: Invalid or deleted key");
    	} else {
    		await client.del("secret." + req.originalUrl.split("/")[3]);
    		await client.del("timestamp." + req.originalUrl.split("/")[3]);
    		res.send(secret);
    	}
    })();
  }

  else if(req.originalUrl.match("/secret/")) {
    res.set("Content-Type", "text/html");
    res.send(app_data["/secret.html"])
  }

  else {
    res.set("Content-Type", "text/html");
    res.send(app_data["/404.html"]);
  }
});


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
  console.log("Admin listening at " + process.env.ADMIN_PREPEND + "/admin");
});
