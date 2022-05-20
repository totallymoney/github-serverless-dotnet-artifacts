#!/bin/bash

set -e

REQUIREMENTS="jq yarn dotnet curl"
for i in $REQUIREMENTS; do
    hash "$i" 2>/dev/null || { echo "$0": I require "$i" but it\'s not installed.; exit 1; }
done

if [ $# -ne 4 ]; then
    echo "$0": usage: publish.sh REPOSITORY PROJECT VERSION COMMIT
    echo "$0": eg: publish.sh mediaingenuity/myrepo src 1.2.3456 master
    echo "$0": OR
    echo "$0": eg: publish.sh mediaingenuity/myrepo path/to/project.fsproj 1.2.3456 b7232ef30b17afbe6d6b4703784cd5e69956e104
    exit 1
fi

if [ -z "$GITHUB_OAUTH_TOKEN" ]; then
    echo "Need to set GITHUB_OAUTH_TOKEN"
    exit 1
fi

REPOSITORY=$1
PROJECT=$2
VERSION=$3
COMMIT=$4
PUBLISH_DIR="publish"
PUBLISH_ZIP="$VERSION.zip"

rm -rf $PUBLISH_DIR
mkdir $PUBLISH_DIR
dotnet lambda package "$PUBLISH_DIR/package.zip" \
  -pl "$PROJECT" -c Release -farch "arm64" --msbuild-parameters "/p:PublishReadyToRun=true"
cp serverless.yml "$PUBLISH_DIR/serverless.yml"
cp package.json "$PUBLISH_DIR/package.json"
cp yarn.lock "$PUBLISH_DIR/yarn.lock"
[ -d "./serverless-artifacts" ] && cp -r serverless-artifacts "$PUBLISH_DIR"
cd $PUBLISH_DIR
zip -r "$PUBLISH_ZIP" .
cd .. || exit

LATEST_TAG="$(git describe --tags --abbrev=0)"
MSGS_SINCE_LATEST_TAG="$(git shortlog "$LATEST_TAG".."$COMMIT" --pretty="%h %s")"
GITHUB_AUTH_HEADER="Authorization: token $GITHUB_OAUTH_TOKEN"

CREATE_RELEASE_REQUEST=$(
  jq -n \
    --arg name "$VERSION" \
    --arg commit "$COMMIT" \
    --arg body "$MSGS_SINCE_LATEST_TAG" \
    '{ tag_name: $name, name: $name, target_commitish: $commit, body: $body }')

echo "Create release request:"
echo "$CREATE_RELEASE_REQUEST"
echo "**********************"

CREATE_RELEASE_RESPONSE=$(
  curl -s -X POST \
    -H "$GITHUB_AUTH_HEADER" \
    -d "$CREATE_RELEASE_REQUEST" \
    "https://api.github.com/repos/$REPOSITORY/releases")

echo "Create release response:"
echo "$CREATE_RELEASE_RESPONSE"
echo "**********************"

RELEASE_UPLOAD_URL=$(
  echo "$CREATE_RELEASE_RESPONSE" |
    jq ".upload_url" |
    sed "s/{?name,label}/?name=$PUBLISH_ZIP/" |
    sed 's/"//g')

echo "Upload url:"
echo "$RELEASE_UPLOAD_URL"
echo "**********************"

UPLOAD_RESPONSE=$(
  curl -s -X POST \
    -H "$GITHUB_AUTH_HEADER" \
    -H "Content-Type: application/octet-stream" \
    --data-binary @"$PUBLISH_DIR/$PUBLISH_ZIP" \
    "$RELEASE_UPLOAD_URL")

echo "Upload response:"
echo "$UPLOAD_RESPONSE"
echo "**********************"
