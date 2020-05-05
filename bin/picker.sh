#!/bin/bash

set -e

REQUIREMENTS="aws jq pip3 python"
for i in $REQUIREMENTS; do
    hash "$i" 2>/dev/null || { echo "$0": I require "$i" but it\'s not installed.; exit 1; }
done

pip3 install pick yq --quiet
git fetch origin --quiet
PICKER_PATH="$(yarn bin)/$(dirname "$(readlink "$0")")/picker.py"
CANDIDATE_FUNCTION_NAME=$(yq -r '.service + "-prod-" + (.functions | keys? | .[0])' serverless.yml)

set +e # safely get function config
CANDIDATE_FUNCTION_CONFIG=$(aws lambda get-function-configuration --function-name "$CANDIDATE_FUNCTION_NAME" 2>/dev/null)
set -e

PROD_VERSION=$(echo "$CANDIDATE_FUNCTION_CONFIG" | jq -r '.Environment.Variables.VERSION')
python "$PICKER_PATH" "$PROD_VERSION"
