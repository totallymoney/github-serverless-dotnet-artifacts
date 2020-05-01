#!/bin/bash

set -e

REQUIREMENTS="pip3 python"
for i in $REQUIREMENTS; do
    hash "$i" 2>/dev/null || { echo "$0": I require "$i" but it\'s not installed.; exit 1; }
done

pip3 install -q pick
PICKER_PATH="$(yarn bin)/$(dirname $(readlink $0))/picker.py"
python $PICKER_PATH