#!/bin/bash

set -ex

REQUIREMENTS="gh dotnet"
for i in $REQUIREMENTS; do
  hash "$i" 2>/dev/null || { echo "$0": I require "$i" but it\'s not installed.; exit 1; }
done

if [ $# -eq 0 ]; then
  echo "$0": "usage: publish.sh VERSION [ -p project ]" >&2
  echo "$0": "eg: publish.sh 1.2.3" >&2
  echo "$0": "eg: publish.sh 1.2.3 -p project/dir" >&2
  exit 1
fi

VERSION=$1
shift

PROJECT=./src
while getopts "p::" opt; do
  case $opt in
    p) PROJECT=${OPTARG} ;;
    *) ;;
  esac
done

rm -rf ./publish
mkdir ./publish
dotnet lambda package ./publish/package.zip -pl "$PROJECT" -c Release -farch arm64
cp ./{serverless.yml,package.json,yarn.lock} ./publish
[ -d "./serverless-artifacts" ] && cp -r ./serverless-artifacts ./publish
zip -r "./publish/archive.zip" ./publish
gh release create "$VERSION" "./publish/archive.zip" --generate-notes
rm -rf ./publish
