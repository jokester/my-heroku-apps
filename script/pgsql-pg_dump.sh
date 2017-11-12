#!/bin/sh

####
# dump pgsql db
###

set -ue
cd "$(dirname "$0")"
exec sh pgsql-command.sh pg_dump
