#!/bin/bash

set -ex

REQUIREMENTS="gh dotnet tar"
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

rm -rf .gsda
mkdir .gsda
dotnet lambda package .gsda/package.zip -pl "$PROJECT" -c Release -farch arm64 --msbuild-parameters /p:Version="$VERSION"
cp ./{serverless.yml,package.json,yarn.lock} .gsda
[ -d ./serverless-artifacts ] && cp -r ./serverless-artifacts .gsda
tar --create --verbose --file=.gsda/archive.zip --directory=.gsda .
gh release create "$VERSION" .gsda/archive.zip --generate-notes
rm -rf .gsda
