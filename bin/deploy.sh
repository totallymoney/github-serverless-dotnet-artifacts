#!/bin/bash

set -ex

REQUIREMENTS="gh yarn"
for i in $REQUIREMENTS; do
  hash "$i" 2>/dev/null || { echo "$0": I require "$i" but it\'s not installed.; exit 1; }
done

if [ $# -ne 2 ]; then
  echo "$0": usage: deploy.sh VERSION ENVIRONMENT
  echo "$0": eg: deploy.sh 1.2.3 stage
  exit 1
fi

VERSION=$1
ENVIRONMENT=$2
NOW_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

rm -rf ./deploy ./deploy.zip
gh release download "$VERSION" --output deploy.zip
unzip ./deploy.zip -d ./deploy
cd ./deploy
yarn install --silent --no-progress --frozen-lockfile
DEPLOYED_DATE=$NOW_ISO yarn run sls deploy --stage "$ENVIRONMENT" --verbose
cd .. || exit
rm -rf ./deploy ./deploy.zip
