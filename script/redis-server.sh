#!/bin/sh

####
# start redis server and listen to local socket
# mostly started by pm2, so no chmod +x on this file
###

set -ue
cd "$(dirname "$0")/../temp/redis.dev"

exec redis-server `#--port 0` --unixsocket "./redis.socket" --save 5 1 --appendonly "yes"
#                 ^no tcp  ^socket                       ^save in 5 sec
#                                                         NOTE: not "5 1"
