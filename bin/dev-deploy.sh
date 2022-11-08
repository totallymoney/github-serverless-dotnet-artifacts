#!/bin/bash

set -e

if [ $# -eq 0 ]; then
    echo "$0": usage: \'gsda-dev-deploy ENVIRONMENT\' or \'gsda-dev-deploy ENVIRONMENT PROJECT_LOCATION\'
    echo "$0": eg: \'gsda-dev-deploy dev\' or \'gsda-dev-deploy dev src\'
    exit 1
fi

# support an optional 2nd argument for project location by setting it to a default value if not provided
if [ $# -eq 1 ]; then
    PROJECT_LOCATION="src"
else
    PROJECT_LOCATION=$2
fi

ENVIRONMENT=$1
NOW_ISO=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
export VERSION="0.0.0"

rm -rf "package.zip"

dotnet lambda package "package.zip" -pl "$PROJECT_LOCATION" -c Release -farch "arm64"
DEPLOYED_DATE=$NOW_ISO yarn run sls deploy --stage "$ENVIRONMENT" --verbose
