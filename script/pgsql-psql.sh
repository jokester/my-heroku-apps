#!/bin/sh

####
# start pgsql
###

set -ue
cd "$(dirname "$0")"
exec sh pgsql-command.sh psql
