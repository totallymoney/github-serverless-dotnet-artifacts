#!/bin/bash

aws sts get-caller-identity --no-cli-pager || aws sso login && ./dev-deploy.sh
