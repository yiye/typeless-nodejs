# -*- coding: utf-8 -*-
"""
typeless chat_server 
handler websocket connections and manage rooms
"""
# TODO if create a room but there is nobody get into how to recycle room
import typeless_exce
import config

# data base stuff
import redis
#import pymongo

class Redis_Connection(object):
    ''' singleton of redis connection '''
    def __init__(self):
        self.connection = redis.Redis(config.db_host, db=config.redis_db,password=config.redis_password)
    @staticmethod
    def instance():
        if not hasattr(Redis_Connection, "_instance"):
            Redis_Connection._instance = Redis_Connection()
        return Redis_Connection._instance
    

# zeromq things
import zmq
from zmq.eventloop import ioloop,zmqstream
ioloop.install()# HACK: this must be callled before ioloop.IOLoop.instance() is called.

context = zmq.Context() # must make a context
sock = context.socket(zmq.REP) # The Reply side of REQUEST-REPLY MODEL of zeromq
if config.use_ipc:
	sock.bind("ipc:///tmp/typeless.ipc") # bind the REP socket to a file --- /tmp/zm/0
else:
	sock.bind("tcp://127.0.0.1:8887")

class ReplyProc:

    def __init__(self, rmg):
        self.rmg = rmg


    def create_room(self, data):
        if data['room_num'] != 'null':
            num = self.rmg.get_newroom(str(data['room_num']))
        else:
            num = self.rmg.get_newroom()

        return '{"state" : "1", "data":{"room_num":"%s"}}' % str(num)


    def broadcast(self, data):
        try:
            self.rmg.all_rooms[data['room_num']].broadcast(data['msg'])
        except KeyError:
            raise typeless_exce.RoomNotExist(str(data['room_num']))
        return '{"state" : "1"}'
                
                
    def remove_user(self, data):
        #TODO delete
        def check_users(line):
            logging.info(str(line)+"Now in Room " + data['room_num'])
            try:
                for cli in self.rmg.all_rooms[data['room_num']].cli_ls:
                    print "   ", cli.current_user
            except Exception:
                pass

        #TODO delete Debug code
        check_users(53)
        try:
            self.rmg.all_rooms[data['room_num']].remove_name(str(data['username']))
        except KeyError:
            raise typeless_exce.RoomNotExist(str(data['room_num']))
#        except Exception,e:
#            import traceback
#            traceback.print_exc()
#            # $ CODE DEBGG
#            logging.info("error in remove_user")

        check_users(58)
        return '{"state" : "1"}'



    def reply(self, data):
        ''' the callback 
        data is a list , use data[0]
        '''

        logging.info("raw data"+data[0])
        data = tornado.escape.json_decode(data[0]) 

        try:
            msg = getattr(self, str(data['act']))(data)
        except AttributeError:
            msg = typeless_exce.NoSuchAct(str(data['act'])).toResult()
        except typeless_exce.TypelessException as e:
            msg = e.toResult()

        logging.info("ipc:"+msg+" type:"+str(type(msg)))
        sock.send(msg)



# tornado stuff
import logging
import random
import os
import config
#import sys
#import hashlib
import tornado.web
import tornado.websocket
import tornado.httpserver
import tornado.ioloop
import tornado.options
from tornado.options import define,options

define("port",default=config.chat_port,help="run on the given port",type=int)

class Room(object):
    '''Room is a collection of GuestAgent.

    GuestAgent just need to communicate with their Room to do almost all operat-
    ion'''

    def __init__(self, num="null"):
        self.cli_ls = []
        self.room_num = num
        self.room_manager = Room_manager.instance()


    def add(self, guest_agent):
        self.cli_ls.append(guest_agent)

    
    def remove(self, guest_agent):
        guest_agent.redis.delete("user:%s:room" % guest_agent.current_user)
        guest_agent.redis.srem("room:%s:members" % self.room_num, guest_agent.current_user)

        guest_agent.room.cli_ls.remove(guest_agent)
        guest_agent.close()

        if not self.cli_ls:
            self.room_manager.recycle(self.room_num)


    def remove_name(self, username):
        ''' Remove GuestAgent by its username'''

        for cli in self.cli_ls:
            if cli.current_user == username:
                self.remove(cli)
                break
        else:
            raise typeless_exce.UserNotInRoom(self.room_num, username,)

    
    def broadcast(self, message):
        '''Broad message to all client which in this room.'''
        #logging.info("all client in room %s is"%self.room_num+str(self.cli_ls))
        for cli in self.cli_ls:
            try:
                cli.write_message(message)
            except typeless_exce.GuestError:
                cli.redis.smove("room:%s:members" % self.room_num,
                        "room:%s:invited" % self.room_num,
                        cli.current_user)
                self.remove(cli)

    
    def empty(self):
        if self.cli_ls:
            return False
        else:
            return True

    
    
class Room_manager(object):
    '''Room_manager model of chat server.

    It's a singleton. It's the core of this server. The root of all class. It is
    used to collect no-active rooms and create new rooms. In this manager this is
    a room pool, the size of this pool is describe by ROOM_POOL_NUM. Only when
    the pool is empty the server will create new room.

    The rooms are collected in an dict. It's not very effective. we will fix it
    latter'''

    
    ROOM_POOL_NUM = config.room_pool
    ROOM_NUM_RANGE = config.room_num_range
    room_num = 0
    _instance = ''

    
    @property
    def redis(self):
        return self.redis_connection

    @classmethod
    def instance(cls):
        '''return the only instance'''
        if not cls._instance:
            cls._instance = cls()
            cls._instance.init()
            cls._instance.redis_connection = Redis_Connection.instance().connection
        return cls._instance

    
    def init(self):
        '''init the singleton'''
        self.all_rooms = {} # room_number:room_obj model
        # create room pool
        self.room_pool = [ Room() for i in xrange(self.ROOM_POOL_NUM) ]

    
    def recieve_new_guest(self, guest_agent, room_num):
        ''' add a new guest (actually is the guest agent) to the room with
            number room_num.'''

        try:
            self.all_rooms[room_num].add(guest_agent)
            return self.all_rooms[room_num]
        except KeyError:
            raise typeless_exce.RoomNotExist(room_num)

    
    def get_newroom(self, num=None):
        '''Return a new room num'''

        if len(self.all_rooms)>= config.room_upper:
            raise typeless_exce.NoAvailableRoom()

        if self.room_pool:
            room = self.room_pool.pop()
        else:
            room = Room()

        if not num:
            #NOTE here make the maxium room_num lower than 65536
            num = i = random.randint(0, self.ROOM_NUM_RANGE)
            while self.all_rooms.has_key(str(i)):
                i += 1
                i %= self.ROOM_NUM_RANGE+1
                if i == num:
                    raise typeless_exce.NoAvailableRoom()
            num = str(i)

        self.all_rooms[num] = room
        room.room_num = num

        logging.info("all room len %d" % len(self.all_rooms))
        logging.info("room pool remain len %d" % len(self.room_pool))

        return num

    
    def recycle(self, room_num):
        '''Recycle the room which has no Guest there'''

        logging.info("recycle room: %r"%room_num)
        if len(self.all_rooms) <= self.ROOM_POOL_NUM:
        #    logging.info("Append pool")
            self.room_pool.append(self.all_rooms[room_num])

        #TODO whether add to free_room
        #logging.info("clear key")

        for key in self.redis.keys("room:%s:*" % room_num):
            self.redis.delete(key)

        #logging.info("del from room_num")
        del self.all_rooms[room_num]

    
    def hasRoom(self, room_num):
        '''Check if the room is exist'''
        return self.all_rooms.has_key(room_num)



#TODO dirty code. Find a way to solve refer each other.
# make a zmqstream and register the callback
stream = zmqstream.ZMQStream(sock)
rmg = Room_manager.instance()
stream.on_recv(ReplyProc(rmg).reply) # register
    
    
class BaseHandler(tornado.web.RequestHandler):
    '''The base class of all web handlers expect the GuestAgent. '''

    @property
    def redis(self):
        return self.application.redis_connection


    #@property
    #def mongo(self):
        #return self.application.mongo_typeless


    def get_current_user(self):
        return self.get_secure_cookie("username")

    
    
class GuestAgent(tornado.websocket.WebSocketHandler, BaseHandler):
    '''handle websocket connection between guest and this object.

    one GuestAgent obejct for one guest,
    guest ony need to talk to the agent,
    and the agent will only communicate with their Room.
    If the Socket is closed, Any attempt want to use this object will cause a
    GuestOfflineError'''
    
    
    def __init__(self, application, request, **kwargs):
        tornado.websocket.WebSocketHandler.__init__(self,
                application, request, **kwargs)
        # to indicate if the Guest Agent has start work
        self.active = False
        self.room = None

    
    # Now in BaseHandler
    #def get_current_user(self):
        #return self.get_secure_cookie("username")

    
    def open(self, room_num):
        '''when a guest connect to server
        CHECK LOGIN FIRST, THEN CHECK WHICH ROOM HE WAS IN
        else '''
        self.room_manager = Room_manager.instance()#singleton

        prefix = "room:%s:" % room_num
        # simply check if login
        if self.current_user and  \
              self.redis.sismember(prefix+"members", self.current_user.lower()):
            
            try:
                self.room_num = room_num
                self.room = self.room_manager.recieve_new_guest(self, room_num)
                self.active = True
            except typeless_exce.RoomError as e:
                self.write_message(e.toResult())
                logging.info(e)
                self.active = False
                self.close()
        else:
            self.active = False
            self.close()

    
    def on_message(self, message):
        '''get client list of a room and broadcast'''

        #NOTE: USE OLD CODE
        if self.active:
            self.room.broadcast(message)
        else:
            raise typeless_exce.GuestOfflineError(self.current_user)

    
    def write_message(self, message, binary=False):
        if self.active:
            tornado.websocket.WebSocketHandler.write_message(self,
                    message, binary)
        else:
            raise typeless_exce.GuestOfflineError(self.current_user)

    
    def on_close(self):
        logging.info("on_close")
        if self.active:
            if self in self.room.cli_ls:
                try:
                    self.room.remove(self)
                except AttributeError:
                    # self WS has closed
                    pass
        self.active = False


    
    
#class RoomCreator(BaseHandler):
    #def __init__(self, application, request, **kwargs):
        #tornado.web.RequestHandler.__init__(self, application, request,
                                            #**kwargs)
        #self.room_manager = Room_manager.instance()


class Application(tornado.web.Application):

    def __init__(self):

        self.redis_connection = Redis_Connection.instance().connection#redis.Redis(config.db_host, db=1)
        #self.mongo_connection = pymongo.Connection()
        #self.mongo_typeless = self.mongo_connection.typeless
        #self.mongo_typeless.authenticate(config.db_username,config.db_password)

        settings = {
                "static_path": os.path.join(os.path.dirname(__file__), "static"),
                "template_path": os.path.join(os.path.dirname(__file__), "templates"),
                "cookie_secret" : "61oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
                "debug":config.debug,
                }

        handlers = [

                (r"/room/([0-9]+)/ws$", GuestAgent),
                (r"/static/(.*)", tornado.web.StaticFileHandler,
                    dict(path=settings['static_path'])),
                ]

        tornado.web.Application.__init__(self, handlers, **settings)

    
    
if __name__=="__main__":
    tornado.options.parse_command_line()
    httpserver = tornado.httpserver.HTTPServer(Application())
    httpserver.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
