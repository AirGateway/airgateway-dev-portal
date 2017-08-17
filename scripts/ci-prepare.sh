#!/bin/sh
export GOPATH=/tmp/go
echo "Installing Hugo"

set -e

go get -u -v github.com/gohugoio/hugo

echo "Fetching submodules"
git submodule init
git submodule update

echo "Done"
