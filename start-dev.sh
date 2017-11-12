#!/bin/bash

set -ue
cd "$(dirname "$0")"

RUN_LOCK="$PWD/temp/running-dev.lock"
export PGDATA="$PWD/temp/pgdata.dev"
DATABASE_NAME="plato"

ensure-deps () {
  echo "checking for dependcies"
  for bin in redis-server pm2 yarn node pg_ctl postgres ; do
    if ! command -v $bin ; then
      echo "$bin not found. quitting"
      exit 1
    fi
  done
}

init-pgsql () {
  if [[ -d "$PGDATA" ]] ; then
    echo "$PGDATA already exists. not initlaizeing PostgreSQL again"
  else
    echo "initalizing PostgreSQL within $PGDATA"
    pg_ctl init -D "$PGDATA"

    echo "creating database"
    postgres --single postgres < script/init-db.sql
  fi
}

init-deps () {
  init-pgsql &
  yarn --ignore-engines &
  wait
}

acquire-runlock () {
  if [[ -f "$RUN_LOCK" ]]; then
    echo "already running, not starting again"
    echo "  (if you think this is wrong: remove file at '$RUN_LOCK' and run again"
    exit 3
  else
    touch "$RUN_LOCK"
  fi
  trap release-runlock EXIT
}

release-runlock () {
  rm -f "$RUN_LOCK"
}

run-pm2 () {
  pm2 start ./script/pm2-dev.config.js
  pm2 monit
  pm2 stop ./script/pm2-dev.config.js
}

acquire-runlock
ensure-deps
init-deps
run-pm2
