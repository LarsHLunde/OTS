#!/bin/bash

curl -sL https://rpm.nodesource.com/setup_14.x | sudo bash -
sudo yum install -y nodejs redis
npm install express express-basic-auth redis body-parser path dotenv bcrypt
sudo systemctl enable redis --now
cp example.env .env
