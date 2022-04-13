#!/bin/bash

set -e

if [ $# -ne 1 ]; then
    echo "$0": usage: quick.sh ENVIRONMENT
    echo "$0": eg: quick.sh dev
    exit 1
fi

ENVIRONMENT=$1
NOW_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export VERSION="0.0.0"

rm -rf "package.zip"
dotnet lambda package "package.zip" -pl src -c Release -farch "arm64"
DEPLOYED_DATE=$NOW_ISO yarn run sls deploy --stage "$ENVIRONMENT" --verbose
