#!/bin/bash

set -e

REQUIREMENTS="jq yarn dotnet curl"
for i in $REQUIREMENTS; do
    hash "$i" 2>/dev/null || { echo "$0": I require "$i" but it\'s not installed.; exit 1; }
done

if [ $# -ne 3 ]; then
    echo "$0": usage: deploy.sh REPOSITORY VERSION ENVIRONMENT
    echo "$0": eg: deploy.sh mediaingenuity/myrepo 1.2.3456 stage
    exit 1
fi

if [ -z "$GITHUB_OAUTH_TOKEN" ]; then
    echo "Need to set GITHUB_OAUTH_TOKEN"
    exit 1
fi

REPOSITORY=$1
export VERSION=$2
ENVIRONMENT=$3
RELEASES_API="https://api.github.com/repos/$REPOSITORY/releases"
ASSET_ID=$(curl -s -H "Authorization: token $GITHUB_OAUTH_TOKEN" "$RELEASES_API/tags/$VERSION" | jq ".assets[0].id")
DEPLOY_DIR="deploy"
DEPLOY_ZIP="$DEPLOY_DIR.zip"

curl -sL -H "Accept: application/octet-stream" "$RELEASES_API/assets/$ASSET_ID?access_token=$GITHUB_OAUTH_TOKEN" -o "$DEPLOY_ZIP"
rm -rf $DEPLOY_DIR
unzip $DEPLOY_ZIP -d $DEPLOY_DIR
rm -rf $DEPLOY_ZIP
cd $DEPLOY_DIR
yarn install -s --no-progress
yarn run sls deploy --stage "$ENVIRONMENT" --force --verbose
cd .. || exit
