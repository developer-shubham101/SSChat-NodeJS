#!/usr/bin/env bash

echo $1
ENV=$1
PRODUCTION_ENV_NAME="public"


if [ "$PRODUCTION_ENV_NAME" = "$ENV" ]; then
rm ./src/config.js

git add .
git commit -m "make it better"
ssh -T git@developershubham
git push origin master
   
else
cp ./config/config.js  ./src/config.js


read -r -d '' applescriptCode <<'EOF'
   set dialogText to text returned of (display dialog "Enter Commit" default answer "make it better")
   return dialogText
EOF

dialogText=$(osascript -e "$applescriptCode");

echo $dialogText;



git add .
git commit -m "$dialogText"
git push heroku master

fi