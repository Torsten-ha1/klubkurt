#!/bin/bash
echo "-----------------------------------"
echo "*** Deploy script klub-kurt.com ***"
echo "-----------------------------------"
echo
echo "Pulling git repo"

echo $NODE_ENV

cd /opt/klubkurt/

git pull 

cd admin/client
npm i --production=false --legacy-peer-deps
npm run build

# copy built vue.js app to apache webroot
rm -rf /var/www/admin.klub-kurt.com/public_html/*
cp -r dist/* /var/www/admin.klub-kurt.com/public_html/

cd /opt/klubkurt/admin/server
npm install
pm2 restart server.js

pm2 list

echo "Setup website files"
echo
cd /opt/klubkurt/website
cp -r . /var/www/klub-kurt.com/public_html/

echo 
echo "End deploy"
