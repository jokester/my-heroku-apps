#!/bin/sh

####
# exec redis-cli with local socket
### 

set -ue
cd "$(dirname "$0")/../temp/redis.dev"
exec redis-cli -s "$PWD/redis.socket" "$@"

