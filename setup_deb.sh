#!/bin/bash

curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs redis
npm install express express-basic-auth redis body-parser path dotenv
cp example.env .env
