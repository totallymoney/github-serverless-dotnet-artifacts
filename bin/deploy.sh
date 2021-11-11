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

NOW_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GITHUB_AUTH_HEADER="Authorization: token $GITHUB_OAUTH_TOKEN"
RELEASES_API="https://api.github.com/repos/$REPOSITORY/releases"

CURL_RESPONSE=$(curl -s -H "$GITHUB_AUTH_HEADER" "$RELEASES_API/tags/$VERSION")
ERROR_MESSAGE=$(echo "$CURL_RESPONSE" | jq ".message")

if [ "$ERROR_MESSAGE" == "\"Bad credentials\"" ]; then
    echo "Error: Invalid GITHUB_OAUTH_TOKEN"
    exit 1
elif [ "$ERROR_MESSAGE" == "\"Not found\"" ]; then
    echo "Error: Could not find github repository, ensure the GITHUB_OAUTH_TOKEN and the VERSION are correct"
    exit 1
elif [ "$ERROR_MESSAGE" != "null" ]; then
    echo "Error getting github repository: ${ERROR_MESSAGE}"
    exit 1
fi

ASSET_ID=$(echo "$CURL_RESPONSE" | jq ".assets[0].id")
DEPLOY_DIR="deploy"
DEPLOY_ZIP="$DEPLOY_DIR.zip"

curl -sL -H "$GITHUB_AUTH_HEADER" -H "Accept: application/octet-stream" "$RELEASES_API/assets/$ASSET_ID" -o "$DEPLOY_ZIP"
rm -rf $DEPLOY_DIR
unzip $DEPLOY_ZIP -d $DEPLOY_DIR
rm -rf $DEPLOY_ZIP
cd $DEPLOY_DIR
yarn install -s --no-progress
DEPLOYED_DATE=$NOW_ISO yarn run sls deploy --stage "$ENVIRONMENT" --verbose
cd .. || exit
