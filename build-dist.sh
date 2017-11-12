#!/bin/bash

# TODO: test in osx (bsd find, etc)

set -ue
cd "$(dirname "$0")"

rm -rf public-*
yarn

npm run webpack:prod

GIT_COMMIT=$(git rev-parse HEAD)
GIT_ABBR="${GIT_COMMIT:0:6}"

pushd public

echo "creating asset + sourcemap archive"
tar cJvf "../dist/dist-${GIT_ABBR}-full.txz" .

echo "creating asset-only archive"
rm -rf stats.html static/sourcemap
tar cJvf "../dist/dist-${GIT_ABBR}.txz" .

popd

ln -svf "dist-${GIT_ABBR}.txz" "dist/latest-full.txz"
ln -svf "dist-${GIT_ABBR}.txz" "dist/latest.txz"

