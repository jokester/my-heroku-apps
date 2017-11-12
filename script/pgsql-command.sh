#!/bin/sh

####
# start pg binary with running socket
###

set -ue
cd "$(dirname "$0")/../temp"

export PGDATABASE=plato

if [[ $# -lt 1 ]]; then
  echo "usage: $0 PG_COMMAND arguments..."
  echo "    where PG_COMMAND is any pg command that expects a living server, e.g. \"psql\" or \"createdb\"."
else
  cmd="$1"
  shift
  exec "$cmd" --host "$PWD"
fi
