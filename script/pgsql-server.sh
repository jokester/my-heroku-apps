#!/bin/bash

####
# start pgsql-server
# mostly started by pm2, so no chmod +x on this file
###

set -ue
cd "$(dirname "$0")/../temp"

# not disabling tcp socket: easier to connect via port
# -c "listen_addresses="  \
exec postgres \
  `#ensure $PGDATA is defined` -D "$PGDATA" \
  -c "unix_socket_directories=$PWD" \
  2>&1
