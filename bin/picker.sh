#!/bin/bash

set -e

REQUIREMENTS="pip3 python3"
for i in $REQUIREMENTS; do
    hash "$i" 2>/dev/null || { echo "$0": I require "$i" but it\'s not installed.; exit 1; }
done

pip3 install -q pick
python3 picker.py