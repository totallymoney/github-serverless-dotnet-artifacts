#!/bin/bash

set -e

REQUIREMENTS="jq yarn dotnet curl"
for i in $REQUIREMENTS; do
    hash "$i" 2>/dev/null || { echo "$0": I require "$i" but it\'s not installed.; exit 1; }
done

if [ $# -ne 3 ]; then
    echo "$0": usage: publish.sh REPOSITORY VERSION COMMIT
    echo "$0": eg: publish.sh mediaingenuity/myrepo 1.2.3456 master
    echo "$0": OR
    echo "$0": eg: publish.sh mediaingenuity/myrepo 1.2.3456 b7232ef30b17afbe6d6b4703784cd5e69956e104
    exit 1
fi

if [ -z "$GITHUB_OAUTH_TOKEN" ]; then
    echo "Need to set GITHUB_OAUTH_TOKEN"
    exit 1
fi

REPOSITORY=$1
VERSION=$2
COMMIT=$3
PUBLISH_DIR="publish"
PUBLISH_ZIP="$VERSION.zip"

rm -rf $PUBLISH_DIR
mkdir $PUBLISH_DIR
dotnet lambda package "$PUBLISH_DIR/package.zip" -pl src -c Release
cp serverless.yml "$PUBLISH_DIR/serverless.yml"
cp package.json "$PUBLISH_DIR/package.json"
cp yarn.lock "$PUBLISH_DIR/yarn.lock"
cd $PUBLISH_DIR
zip -r "$PUBLISH_ZIP" .
cd .. || exit

git fetch origin
LATEST_TAG="$(git describe --tags --abbrev=0)"
MSGS_SINCE_LATEST_TAG="$(git shortlog "$LATEST_TAG".."$COMMIT" --pretty="%h %s")"

jq -n \
    --arg name "$VERSION" \
    --arg commit "$COMMIT" \
    --arg body "$MSGS_SINCE_LATEST_TAG" \
    '{ tag_name: $name, name: $name, target_commitish: $commit, body: $body }' |
    curl -s -X POST -d@- "https://api.github.com/repos/$REPOSITORY/releases?access_token=$GITHUB_OAUTH_TOKEN" |
    jq ".upload_url" |
    sed "s/{?name,label}/?name=$PUBLISH_ZIP/" |
    sed 's/"//g' |
    xargs curl -s -X POST -H "Authorization: token $GITHUB_OAUTH_TOKEN" -H "Content-Type: application/octet-stream" --data-binary @"$PUBLISH_DIR/$PUBLISH_ZIP" |
    jq
