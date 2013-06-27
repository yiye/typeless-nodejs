"""
configration of the server
"""
import os

debug          = True #debug option, when testing set True, when deploying set False

port           = 8888 # typeless_server port, you can change it
server_port    = port # the same
chat_port      = 8889 # chat_server port,do not change it

#mongodb
db_host        = '210.30.97.149' # use default port is ok
db_username    = 'typeless'
db_password    = 'typelessplayswell'
db_name        = 'typeless'

#redis
redis_db       = 6 # the server use 4 , you can use 5 - 10
redis_host     = '210.30.97.149'
redis_password = "typelessplayswell" 

#server congis
expire         = 600 # offline & logout expire time
room_upper     = 100 # room number upper bound / lower bound
room_lower     = 1
room_pool      = 30
room_num_range = 65536

# ipc settings, on linux / unix set True, on windows set False
if os.name=="nt":
	use_ipc=False
else:
	use_ipc=True