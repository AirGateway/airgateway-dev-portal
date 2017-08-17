#!/bin/sh
export GOPATH=/tmp/go
export PATH=$PATH:$GOPATH/bin

set -e

echo "Building portal"
hugo --verbose

echo "Uploading portal"
cd public
scp -r . cloud@cloud.airgtwy.com:/home/cloud/portal_www

echo "Done uploading"
