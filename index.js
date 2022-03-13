//------------------------------- Library imports ------------------------------
const express = require('express');
const app = express();
const admin = express();
const basicAuth = require('express-basic-auth')

const bodyParser = require("body-parser");

const path = require('path');

const fs = require('fs');

const bcrypt = require('bcrypt');

const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

require('dotenv').config();

client.on('connect', () => {
  console.log('Connected to Redis');
  (async () => {
    var admin_key = await client.get("admin.password");
    if (!admin_key) {
      await setPassword("admin");
    }
  })();
});

client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();


//--------------------------------- Functions ----------------------------------

String.prototype.replaceAll = function (replaceThis, withThis) {
   var re = new RegExp(RegExp.quote(replaceThis),"g");
   return this.replace(re, withThis);
};

RegExp.quote = function(str) {
     return str.replace(/([.?*+^$[\]\\(){}-])/g, "\\$1");
};

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

const saltRounds = parseInt(process.env.BCRYPT_SALTROUNDS);

async function setPassword(password) {
  var hashedPassword = await bcrypt.hash(password, saltRounds);
  await client.set("admin.password", hashedPassword);
}

async function checkPassword(password) {
  var hash = await client.get("admin.password");
  var check = await bcrypt.compare(password, hash);
  return check;
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
  rep["files"].forEach((file) => {
    app_data[file] = app_data[file].replaceAll(rep["key"], rep["value"]);
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

var admin_files = fileTree("admin");
var admin_data = {};

var replacements_admin = [
  {
    key: "APP_PREPEND_MARKER",
    value: process.env.APP_PREPEND,
    files: [
      "/index.html",
      "/js/script-admin.js"
    ]
  },
  {
    key: "ADMIN_PREPEND_MARKER",
    value: process.env.ADMIN_PREPEND,
    files: [
      "/index.html",
      "/js/script-admin.js"
    ]
  },
]

admin_files.forEach((element) => {
  if (text_filter[element.split(".").slice(-1).pop()]){
    admin_data[element.substring(5)] = fs.readFileSync(element).toString();
  }

  else {
    admin_data[element.substring(5)] = fs.readFileSync(element);
  }
});

replacements_admin.forEach((rep) => {
  rep["files"].forEach((file) => {
    admin_data[file] = admin_data[file].replaceAll(rep["key"], rep["value"]);
  })
})

admin.use(bodyParser.json());
admin.use(bodyParser.urlencoded({ extended: false }));

async function redisAuthorizer(username, password, cb) {
    var userMatches = basicAuth.safeCompare(username, 'admin');
    var passwordMatches = await checkPassword(password);

    return cb(null, (userMatches & passwordMatches));
}

admin.use(basicAuth({
  authorizer: redisAuthorizer,
  authorizeAsync: true,
  challenge: true
}));


admin.get('/*', function(req, res) {
  if (admin_data[req.originalUrl]){
    var data_type = req.originalUrl.split(".").slice(-1).pop()
    if (text_filter[data_type]) {
      res.set("Content-Type", text_filter[data_type]);
    }
    res.send(admin_data[req.originalUrl]);
  }

  else if(req.originalUrl == "/") {
    res.set("Content-Type", "text/html");
    res.send(admin_data["/index.html"]);
  }

  else if(req.originalUrl.match("/logout")) {
		res.set('WWW-Authenticate', "Basic realm=Authorization Required");
    res.setStatus(401);
    res.redirect(process.env.ADMIN_PREPEND);
  }

  else if(req.originalUrl.match("/keys")) {
    (async () => {
		  var out = {};
      var keys = await client.keys("secret.*");
		  for (let i = 0; i < keys.length; i++) {
			  out[keys[i]] = await client.get("timestamp." + keys[i].substring(7))
		  }
		res.send(JSON.stringify(out));
	  })();
  }

  else {
    res.set("Content-Type", "text/html");
    res.send(app_data["/404.html"]);
  }
});

admin.post('/create', (req, res) => {
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
  console.log("Admin listening at " + process.env.ADMIN_PREPEND);
});
