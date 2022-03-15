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

# This will check for the occurance of arm64 in serverless.yml if it does not exist, we default to x86_64
ARCH=$(grep -oh arm64 serverless.yml | awk -v def="x86_64" '{print} END { if(NR==0) {print def} }')

rm -rf $PUBLISH_DIR
mkdir $PUBLISH_DIR

# can only publish ready to run on linux platform
if [ "$(uname)" == "Linux" ]; then
    echo "Platform is Linux; PublishReadyToRun=true"
    dotnet lambda package "$PUBLISH_DIR/package.zip" -pl "$PROJECT" -c Release -farch "$ARCH" \
        --msbuild-parameters "/p:PublishReadyToRun=true --self-contained false"
else
    echo "Platform is $(uname)"
    dotnet lambda package "$PUBLISH_DIR/package.zip" -pl "$PROJECT" -c Release -farch "$ARCH"
fi

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

jq -n \
    --arg name "$VERSION" \
    --arg commit "$COMMIT" \
    --arg body "$MSGS_SINCE_LATEST_TAG" \
    '{ tag_name: $name, name: $name, target_commitish: $commit, body: $body }' |
    curl -s -X POST -H "$GITHUB_AUTH_HEADER" -d@- "https://api.github.com/repos/$REPOSITORY/releases" |
    jq ".upload_url" |
    sed "s/{?name,label}/?name=$PUBLISH_ZIP/" |
    sed 's/"//g' |
    xargs curl -s -X POST -H "$GITHUB_AUTH_HEADER" -H "Content-Type: application/octet-stream" --data-binary @"$PUBLISH_DIR/$PUBLISH_ZIP"
