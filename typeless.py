# -*- coding: utf-8 -*-

# mongodb and redis stuff
import redis
import pymongo
import config

#pyzmq stuff
import zmq
context = zmq.Context() 
sock = context.socket(zmq.REQ) # req socket
if config.use_ipc:
	sock.connect("ipc:///tmp/typeless.ipc")
else:
	sock.connect("tcp://127.0.0.1:8887")
# tornado things
import logging
import random
import os
import sys
import hashlib
import tornado.web
import tornado.websocket
import tornado.httpserver
import tornado.ioloop
import tornado.options
from tornado.options import define,options
import time
import json
import datetime
import traceback

define("port",default=config.port,help="run on the given port",type=int)

# exceptions
import typeless_exce
from typeless_exce import AjaxError

# ipc stuff
from ipc import ipcFilter
class IpcRequest(ipcFilter):
    def __init__(self,act, **args):
        ipcFilter.__init__(self,act,**args)
    def handle(self,res):
        ''' handle the return value of chat_server '''
        try:
            logging.info(res)
            res_dict = tornado.escape.json_decode(res) # decode
            logging.info(res_dict)
            if res_dict['state'] in ("0","1"):
                return True
            else:
                raise AjaxError(res_dict["state"],res_dict["data"]["why"])
        except AjaxError,e:
            raise e
        except Exception,e:
            traceback.print_exc()
            raise AjaxError(7,"json decode error, or something else when doing IPC")
# decorators: require_login in_room not_in_room require_owner require ....
def require_login(f):
    ''' check username cookie before run f(...)'''
    def wrapper(*args):
        ins = args[0]
        user = ins.get_current_user()
        if user:
            return f(*args)
        else:
            raise AjaxError(4,"user not login")
    return wrapper
def not_in_room(f):
    def wrapper2(*args):
        ins = args[0]
        user = ins.get_current_user()
        room = ins.redis.get("user:"+user+":room")
        # check online
        if user:
            if room == None:
                pass
            elif int(room)<0:
                pass
            else:
                raise AjaxError(2,"user already in room %s"%room)
            return f(*args)
        else:
            raise AjaxError(4,"user not login")
    return wrapper2
def in_room(f):
    ''' has already login, but not in a room'''
    def wrapper1(*args):
        ins = args[0]
        user = ins.get_current_user()
        room = ins.redis.get("user:"+user+":room")
        # check online
        if user:
            if room == None:
                raise AjaxError(2,"user not in room,con not take this operation")
            elif int(room)<0:
                raise AjaxError(2,"user not in room,con not take this operation")
            else:
                pass
            return f(*args)
        else:
            raise AjaxError(4,"user not login")
    return wrapper1
        

def require_owner(f):
    ''' cheack if the man is owner of room , if not raise error.
    '''
    def wrapper(*args):
        ins = args[0]
        user = ins.get_current_user()
        if user:
            # check if man in room
            room = ins.redis.get("user:"+user+":room")
            if room == None:
                raise AjaxError(6,"user is not in room")
            elif int(room)<0:
                raise AjaxError(6,"room number < 0, maybe server bug")
            # check if man is owner
            owner = ins.redis.get("room:"+room+":owner")
            if owner == None:
                raise AjaxError(6,"no such room %s"%room)
            elif owner != user:
                raise AjaxError(5,"user is not owner of room %s ,permission denied"%room)
            elif owner == user:
                return f(*args) # here run the "f" function
            else:pass
        else:
            raise AjaxError(4,"user not login")
    return wrapper

    pass

class BaseHandler(tornado.web.RequestHandler):
    '''redis and mongo access'''
    @property
    def redis(self):
        return self.application.redis_connection
    @property
    def mongo(self):
        return self.application.mongo_typeless
    def room_number_new(self):
        ''' allocate a new room number '''
        room = self.application.new_room()
        logging.info("new room created : %r\n%s"%(room,self.application.room_statistic))
        return room
    def room_number_free(self,num):
        ''' free a used room number '''
        room = self.application.close_room(num)
        logging.info("room closed : %r\n%s"%(room,self.application.room_statistic))
        return room
    def get_current_user(self):
        return self.get_secure_cookie("username")


    ''' an ajax api test page '''
    def get(self):
        self.render("ajax_test.html")
        
class AjaxTestHandler(BaseHandler):
    def get(self):
        self.render("ajax_test.html")
class IndexHandler(BaseHandler):
    def get(self):
        self.render("index.html")
class TypelessHandler(BaseHandler):
    def get(self):
        self.render("typeless.html")
class AboutHandler(BaseHandler):
    '''about us'''
    def get(self):
        self.render("about.html")
# class BugHandler(BaseHandler):
#     def get(self):
#         self.render("typeless.html")
# class HelpHandler(BaseHandler):
#     def get(self):
#         self.render("typeless.html")
class EffectHanler(BaseHandler):
    def get(self):
        self.render("jq_effect.html")
class AjaxHandler(BaseHandler):
    '''handler ALL ajax request of typeless
    using hasattr/getattr to find handle method

    for example:
        if act is "heartheat" , their is a method which name is "heartbeat_handler",
        see below.
    '''
    mail_format = set(["from","to","title","type","content"]) # time stamp relies on the server

    def send_mail(self,mail):
        '''send to someone 's mail box in redis'''
        # check format and get data first
        if self.mail_format - set(mail.keys()):
            raise AjaxError(7,"format of mail wrong:%r"%mail)
        self.redis.rpush("user:"+mail["to"]+":mailbox",json.dumps(mail))# json.dumps hack
        pass
    def get_mail(self,who,howmany=1):
        '''get N mail (default is one),from someone's mailbox
        them remove them from the mailbox
        return value:
            mails,left
        '''
        key = 'user:'+who+':mailbox'
        n = self.redis.llen(key)
        left = 0
        howmany=int(howmany)
        if n < howmany:
            howmany = n
        else:
            left = n-left
        mails = self.redis.lrange(key,0,howmany-1) # get mail
        self.redis.ltrim(key,howmany,n) # delete them from mailbox
        return mails,left

    def post(self):
        '''call handle_msg to handler msg .... '''
        state = self.get_argument("state")
        act = self.get_argument("act")
        data = self.get_argument("data")
#        logging.info("\nSTATE : %s\nACT : %s\nDATA : %s"%(state,act,data)) # logging for debug
        try:
            data = tornado.escape.json_decode(data) # decode json 
        except Exception,e: 
            traceback.print_exc()
            print e
            print data
            data = {}
        finally: pass
        
        try:
            result = self.handle_msg(act,data) #
            # add act here
            result["act"]=act
            logging.info(result)
            result = tornado.escape.json_encode(result) # encode json
            self.write(result)
        except AjaxError,e:
            logging.info(e)
            self.write(e.toResult(act))
        except Exception,e:
            self.write('{"state":"7","act":"%s"}'%act) # server internal error state 7
            traceback.print_exc()
            print e
        finally:
            pass

    def handle_msg(self,act,data):
        ''' 
        use hadattr/getattr to find the handler method for and "act" .
        raise AjaxError with status code
        '''
        method_name = act.lower()+"_handler"
        if hasattr(self,method_name):
            result =  getattr(self,method_name)(data)
            for key in ["_id","password","hashed_pw"]:
                try:
                    del result["data"][key]
                except:pass
                finally:pass
            return result
        else:
            raise AjaxError("3",act+": no handler for this act")

    def heartbeat_handler(self,data):
        # blocking ipc
        IPC = IpcRequest("broadcast",room_num="1",msg=" just test if protocol works fine")
        sock.send(IPC.msg)
        result = sock.recv()
        IPC.handle(result)
        logging.info("chat_server reply: %s"%result)
       # self.set_secure_cookie("test","just a test")
        return {"state":"1"}
        
    @require_login
    def islogin_handler(self,data):
        user = self.get_current_user()
        man = self.mongo.users.find_one({"username":user})
        prefix = "user:"+user+":"
        room = self.redis.get(prefix+"room")
        self.redis.set(prefix+"online","1") # set online
        man["online"]="1"
        if room:
            if int(room)>0:
                man["room"] = room
        return {"state":"1","data":man}

    def login_handler(self,data):
        '''check username & password and set cookie
        
        ONLY online / logouttime / room / mailbox / applicants in redis now.
        '''
        user = data["username"]
        pw = data["hashed_pw"]
        prefix = "user:"+user+":"
        online = self.redis.get(prefix+"online")
        man = ''
        room = self.redis.get(prefix+"room")

        logging.info("try login with,name:%s , pw:%s"%(user,pw))
        logging.info("user already in room : %s"%room)
        # if logined 
        if online == "1":
            logging.info("user already online : %s"%user)
            man = self.mongo.users.find_one({"username":user})
            del man["hashed_pw"]
            man["online"] = "1"
            if room:
                man["room"] = room
            #print man
            # set cookie
            self.set_secure_cookie("username",user)
            return {"state":"1","data":man}
        #if  not login ,find in mongo
        if not self.mongo.users.find_one({"username":user}):
            raise AjaxError(2,"username not exist")
        man = self.mongo.users.find_one({"username":user,"hashed_pw":pw})
        if man is None:
            raise AjaxError(2,"password wrong")
        #load things into redis
        online = "1"
        self.redis.set(prefix+"online",online)
        #set cookie 
        self.set_secure_cookie("username",user)
        return {"state":"1","data":man}
    @require_login
    def logout_handler(self,data):
        # login = 0 clear cookie
        user = self.get_secure_cookie("username")
        prefix = "user:"+user+":"
        self.clear_cookie("username")
        # clear redis and set expire
        self.redis.set(prefix+"online","0")
        self.redis.expire(prefix+"online",config.expire) # 10 min
        self.redis.set(prefix+"logouttime",str(time.time()) )
        self.redis.expire(prefix+"logouttime",config.expire)
        return {"state":"1"}
        
    def register_handler(self,data):
        user,pw,email = data["username"],data["hashed_pw"],data["email"]
        man = self.mongo.users.find_one({"username":user})
        if man is None:
            # write into mongo 
            self.mongo.users.insert(data)
            self.mongo.friends.insert({"username":user,"people":[]})
            del data["hashed_pw"]
            return {"state":"1","data":data} # password will be removed later
        else:
            raise AjaxError(2,"username already exist")
    @require_login
    def modify_profile_handler(self,data):
        user = self.get_current_user()

        # BUG CODE HERE, comment it
        # if user != data["username"]:
        #     raise AjaxError(5,"can modify other's profile")

        # get man's data 
        man = self.mongo.users.find_one({"username":user})
        # change
        keys = data.keys() 
        #print data
        #print keys
        if 'old_pw' in keys: 
            if man['hashed_pw'] == data['old_pw']:
                if 'hashed_pw' in keys: 
                    man['hashed_pw'] = data['hashed_pw']
            else:
                raise AjaxError(2,"old password wrong")
        else:
            raise AjaxError(2,"require old password")
        if 'email' in keys: man['email'] = data['email']
        # save
        self.mongo.users.update({"username":user},man)
        return {"state":"1","data":man}# password will be removed later
    @require_login
    def friend_info_handler(self,data):
        user = self.get_current_user()
        #NOTE friends are restored in self.mongo.friends.find_one({"username":"dawn"})
        people       = self.mongo.friends.find_one({"username":user})["people"] # all people
#        logging.info("%s 's friends : %r "%(user,people))
        people_state = ''
        people_on    = []
        people_off   = []
        # get people's state in redis
        if people:
            people_state = self.redis.mget(["user:"+x+":online" for x in people]) # bug fixed
        else:
            people_state = []
#        logging.info(" people_state: %r"%people_state) # log   

        # divide online and offline
        for i in xrange(len(people)):
            if people_state[i] in ("0",None):
                people_off.append(people[i])
            elif people_state[i] in ("1"):
                people_on.append(people[i])
            else:
                people_off.append(people[i])
            
        # return
        return {"state":"1","data":{"on":people_on,"off":people_off}}
    @require_login
    def search_user_handler(self,data):
        #NOTE : only dirty code for test here
        #TODO : find similar username here
        who = data["keyword"]
        if self.mongo.users.find_one({"username":who}):
            return {"state":"1","data":{"username":who}}
        else:
            raise AjaxError(2,"not such username")
    @require_login
    def fetch_msg_handler(self,data):
        ''' return mails,and number of left mails'''
        me = self.get_current_user()
        mails,left = self.get_mail(who=me,howmany=data["howmany"])

        #hack
        msges = [json.loads(m) for m in mails]

        return {"state":"1","data":{"left":str(left),"msg":msges}}
    @require_login
    def set_friend_handler(self,data):
        ''' "new_user" "del_user" "confirm_user"
        #TODO add more return information later

        #NOTE NOT FULLY TESTED
        '''
        # prepare data
        me          = self.get_current_user()
        new_list    = data.get("new_user")
        del_list    = data.get("del_user")
        confirm_list= data.get("confirm_user")
        logging.info("DEBUG : confirm_list = %r\nme = %r\n"%(confirm_list,me))
        # logging
        logging.info(confirm_list)
        # check if user exist
        friends     = self.mongo.friends.find_one({"username":me})["people"] # get my friend list
        prefix      = "user:"+me+":"
        new_man,del_man,confirm_man=[],[],[]
        aliens = [] # people not exists on earth
        if new_list:
            new_man = self.mongo.users.find({"username":{"$in":new_list}}) # 取请的和实际存在的之间的交集
        if del_list:
            del_man = del_list
        confirm_man = confirm_list
        # process new man
        if new_list:
            aliens = list(new_list) #
        for man in new_man:
            mail = {"from"  :me,
                    "to"    :man['username'],
                    "title" :"%s want to be your friend"%me,
                    "type"  :"add_friend",
                    "text"  :"",
                    "content":{}}
            self.send_mail(mail)
            self.redis.sadd("user:"+man["username"]+":applicants",me) # add me to his list of friend_applicants
            aliens.remove(man["username"]) # delete humans , and the left is aliens
        logging.info("aliens : %s"%aliens)

        # process del man
        #TODO ,could be optimized 
        #print del_man
        for man in del_man:
            try:
                self.mongo.friends.update({"username":me},{"$pull":{"people":man}})
                logging.info("remove friend : %s"%man)
            except Exception,e:
                logging.info(e)
                pass

        # process confirm man
        if confirm_man:
            for man in confirm_man:
                # check redis if in redis: add to friends,send mail, then donothing.
                logging.info("is confirming : %s ..."%man)
                if self.redis.sismember("user:"+me+":applicants",man):
                    # ======== DEBUG ========
                    logging.info("%s confirmed. will add to friend list."%man)
                    # ======== DEBUG END ========
                    self.redis.srem("user:"+man+":applicants",me) # modify redis
                    mail_to_man = {"from"  :"Typeless Server",
                                    "to"    :man,
                                    "title" :"%s and you are friends now."%me,
                                    "type"  :"inform",
                                    "text"  :"",
                                    "content":{}}
                    self.send_mail(mail_to_man)
                    mail_to_me = {"from"  :"Typeless Server",
                                    "to"    :me,
                                    "title" :"you have confirmed %s as your friend."%man,
                                    "type"  :"inform",
                                    "text"  :"",
                                    "content":{}}
                    self.send_mail(mail_to_me)
                    # write to mongo
                    self.mongo.friends.update({"username":me},{"$addToSet":{"people":man}})
                    self.mongo.friends.update({"username":man},{"$addToSet":{"people":me}}) #NOTE,could be optimized, could be combined to ONE query
        return {"state":"1"} # else return state 6 with proper data

    # below : handlers for room operations
    @in_room
    def room_info_handler(self,data):
        ''' client send: 
        'data':{'what':['room_number','owner','paint_mode','painter','members','invited']}
        ASK WHAT , GIVE WHAT

        #NOTE NOT FULLY TESTED
        '''
        # prepare
        what =''
        try:
            what = data["what"]
        except:
            what = ()
        me = self.get_current_user()
        keys = []
        room = self.redis.get("user:"+me+":room")

        # get what he wants
        prefix = "room:"+room+":"
        result = {}
        # get default things
        result["room_number"]   = room
        result["paint_mode"]    = self.redis.get(prefix+"paint_mode")
        result["painter"]       = self.redis.get(prefix+"painter")
        result["owner"]         = self.redis.get(prefix+"owner")
        result["room_password"]      = self.redis.get(prefix+"password") # password will be automatically removed from the dict, so use room_password
        logging.info(result); # debug 
        # get more things
        if "members" in what:
            result["members"]   = list(self.redis.smembers(prefix+"members"))
        if "invited" in what:
            result["invited"]   = list(self.redis.smembers(prefix+"invited"))
        # return things
        return {"state":"1","data":result}
    @not_in_room
    def create_room_handler(self,data):
        '''tell chat_server to create relational objests via zeromq (sock) 
        NOT TESTED'''
        me = self.get_current_user()
        #TODO :generate a room number 
        room = self.room_number_new()
        #prepare data ,get default settings NOTE: could be more elegant
        default_setting = {"mode":"free","password":""}
        if data.has_key("mode"):
            pass
        elif data.has_key("paint_mode"):
            data["mode"] = data["paint_mode"]
        else:
            data["mode"] = "free" # default mode is free
        if not data.has_key("password"):
            data["password"]=""
        logging.info("settings : %r"%data)
        prefix = "room:"+room+":"
        # prepare redis , room related
        # paint_mode , painter, owner , members , invited , password
        self.redis.set(prefix+"paint_mode",data["mode"])
        self.redis.set(prefix+"painter",me)
        self.redis.set(prefix+"owner",me)
        self.redis.set(prefix+"password",data["password"])
        self.redis.sadd(prefix+"members",me)
        self.redis.sadd(prefix+"invited",me) # no use , just prevent some bug caused by None value
        # user related 
        self.redis.set("user:"+me+":room",room)
        #TODO :tell chat_server to make related objects
        try:
            IPC = IpcRequest("create_room",room_num=room)
            sock.send(IPC.msg)
            IPC.handle(sock.recv())
        except Exception,e:
            # if exception , clean all things and raise error
            self.redis.delete(prefix+"paint_mode",prefix+"painter",prefix+"owner",prefix+"password",prefix+"members",prefix+"invited","user:"+me+":room")
            self.room_number_free(room)
            raise e
        return {"state":"1","data":{"room_number":room}}
    @not_in_room
    def enter_room_handler(self,data):
        '''NOT TESTED'''
        room = data["room_number"]
        me = self.get_current_user()
        members_key = "room:"+room+":members"
        invited_key = "room:"+room+":invited"
        # check if is invited 
        if self.redis.sismember(invited_key,me):
            self.redis.srem(invited_key,me)
            self.redis.sadd(members_key,me)
            self.redis.set("user:"+me+":room",room)
            return {"state":"1","data":{"room_number":room}}
        # check if has password and pw right
        pw = data.get("password")
        if pw == None:
            raise AjaxError(2,"you are not invited and you provide an empty password")
        # compare
        true_pw = self.redis.get("room:"+room+":password")
        if true_pw == pw:
            self.redis.sadd(members_key,me)
            self.redis.set("user:"+me+":room",room)
            return {"state":"1","data":{"room_number":room}}
        else:
            raise AjaxError(5,"not invited and password wrong")
    
    @in_room
    def leave_room_handler(self,data):
        '''
        clean user's data
        if me is owner: select random one as new owner
        if me is painter : set painter as owner
        NOT TESTED
        '''
        # todo clear data in redis
        me = self.get_current_user()
        prefix = "user:"+me+":"
        room = self.redis.get(prefix+"room")

        # tell chat_server about this
        IPC = IpcRequest("remove_user",room_num=room,username=me)
        sock.send(IPC.msg)
        res = sock.recv()
        try:
            IPC.handle(res)
        except:
            traceback.print_exc()
            pass

        # clean data
        self.redis.delete(prefix+"room")
        # self.redis.set(prefix+"room","-1")
        self.redis.srem("room:"+room+":members",me)
        self.redis.srem("room:"+room+":invited",me) # also clean this

        # if me is room owner, randomly select another one as owner
        owner  = self.redis.get(prefix+"owner")
        if owner == me:
            new_owner  = self.redis.srandmember("room:"+room+":members")
            if new_owner == None:
                self.room_number_free(room) # free number first
                self.clean_up_room()
                return {"state":"1"}
            try:
                self.redis.set("room:"+room+":owner",new_owner)
                #TODO : tell chat_server about this
                return {"state":"1"}
            except Exception,e:
                traceback.print_exc
                raise AjaxError(7,"error occured when change owner")
            finally:pass

        # if me is painter , set painter to owner
        painter = self.redis.get(prefix+"painter")
        if painter == me:
            new_painter  = self.redis.srandmember("room:"+room+":owner")
            if new_painter == None:
                self.room_number_free(room) # free number first
                self.clean_up_room()
                return {"state":"1"}
            try:
                self.redis.set("room:"+room+":painter",new_painter)
                #TODO : tell chat_server about this
                return {"state":"1"}
            except Exception,e:
                traceback.print_exc
                raise AjaxError(7,"error occured when change owner")
            finally:pass
        # if at last nobody
        if self.redis.scard("room:"+room+":members") == 0:
            self.room_number_free(room) # free number first
            self.clean_up_room(room) #
        return {"state":"1"}
    def clean_up_room(self,room):
        '''when a room has nobody in it, this method will be called'''
        prefix = "room:"+room+":"
        self.redis.delete(prefix+"paint_mode",prefix+"painter",prefix+"owner",prefix+"password",prefix+"members",prefix+"invited")
        # TODO : a lot 
        pass
    # the next 5 method change room's property , havd @require_owner decorator
    @require_owner
    def kick_handler(self,data):
        '''NOT TESTED'''
        # prepare
        who = data["who"]
        me = self.get_current_user()
        if who == me:
            raise AjaxError(2,"owner can not kick himself")
        words = data.get("words")
        room = self.redis.get("user:"+me+":room")
        
        
        #clean data
        prefix = "user:"+who+":"
        self.redis.delete(prefix+"room")
        self.redis.srem("room:"+room+":members",who)
        self.redis.srem("room:"+room+":invited",who) # also clean this
        #self.redis.
        # send mail to user
        mail = {"from"  :"Typeless server",
                "to"    :who,
                "title" :"sorry %s, you were kicked out from room %s"%(who,room),
                "type"  :"inform",
                "text"  :" ",
                "content":{}}
        self.send_mail(mail)
        # tell chat_seve vis zeromq
        IPC = IpcRequest("remove_user",room_num=room,username=who)
        sock.send(IPC.msg)
        IPC.handle(sock.recv())
        return {"state":"1"}
    @require_owner
    def password_change_handler(self,data):
        '''NOT TESTED'''
        new_pw  = data["password"]
        me      = self.get_current_user()
        room    = self.redis.get("user:"+me+":room")
        try:
            self.redis.set("room:"+room+":password",new_pw)
            #TODO : tell chat_server about this
            return {"state":"1"}
        except Exception,e:
            traceback.print_exc
            raise AjaxError(7,"error occured when change password")
        finally:pass
    @require_owner
    def owner_change_handler(self,data):
        '''NOT TESTED'''
        new_owner  = data["new_owner"]
        me      = self.get_current_user()
        room    = self.redis.get("user:"+me+":room")
        try:
            self.redis.set("room:"+room+":owner",new_owner)
            #TODO : tell chat_server about this
            return {"state":"1"}
        except Exception,e:
            traceback.print_exc
            raise AjaxError(7,"error occured when change owner")
        finally:pass
    @require_owner
    def paint_mode_change_handler(self,data):
        ''' 
        NOT TESTED
        # NOTE ! does the chat_server broadcast msges which is not from the painter ???
        # need an safe and elegant implementation
        '''
        new_mode  = data["paint_mode"]
        me      = self.get_current_user()
        room    = self.redis.get("user:"+me+":room")
        try:
            self.redis.set("room:"+room+":paint_mode",new_mode)
            #TODO : tell chat_server about this
            return {"state":"1"}
        except Exception,e:
            traceback.print_exc
            raise AjaxError(7,"error occured when change paint mode")
        finally:pass
    @require_owner
    def invite_handler(self,data):
        '''NOT TESTED . NOT COMPLETE'''
        who  = data["who"]
        words = data.get("words")
        if words == None: words = "he said nothing"
        me      = self.get_current_user()
        room    = self.redis.get("user:"+me+":room")
        mail = {"from":me,
                "to":who,
                "title":" %s invite you to room %s"%(me,room),
                "text":words,
                "content":{"room":room},
                "type":"invite"}
        self.redis.sadd("room:"+room+":invited",who) # add to redis
        self.send_mail(mail)
        return {"state":"1"}
    
class Application(tornado.web.Application):
    '''
    init database
        1. make connection
        2. clean data (if debug mode, flushdb)
        3. make init data
    manage ROOM NUMBER:
        1. the redis key is called : room_number_free / room_number_used
        2. room_number management methods: 
            rn_new_room()
            rn_close_room() 
            rn_init()
        3. there's some warpper methods in BaseHandler

    '''
    def __init__(self):
        logging.info("initializing typeless server....")
        self.redis_connection = redis.Redis(host=config.db_host, db=config.redis_db,password=config.redis_password)
        
        self.mongo_connection = pymongo.Connection(host=config.db_host)
        self.mongo_typeless = self.mongo_connection.typeless
        self.mongo_typeless.authenticate(config.db_username,config.db_password) # mongodb auth

        settings = {
                "static_path": os.path.join(os.path.dirname(__file__), "static"),
                "template_path": os.path.join(os.path.dirname(__file__), "templates"),
                "cookie_secret" : "61oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
                "debug":config.debug,
                }
        handlers = [
                (r"/$",IndexHandler),#TypelessHandler),
                (r"/ajax$",AjaxHandler),
                (r"/ajax_test$",AjaxTestHandler),
                (r"/jq_effect$",EffectHanler),# jquery effects
                (r"/typeless$",TypelessHandler),
                (r"/about$",AboutHandler), # about us
                (r"/static/(.*)", tornado.web.StaticFileHandler,
                dict(path=settings['static_path'])),
                ]
        # Have one global connection to the blog DB across all handlers
        tornado.web.Application.__init__(self, handlers, **settings)
        # init room manage
        if settings["debug"]:
            self.redis_connection.flushdb() # fucking
            logging.info("debug=%r"%config.debug)
            logging.info("delete all keys and databases in redis.")
        self.room_number_init()
        logging.info("room number pool initialized.")
        logging.info(self.room_statistic)
        logging.info("typeless_server launched.")
        logging.info("use redis[%d]"%config.redis_db)
        logging.info("visit: http://127.0.0.1:%d"%config.port)


    def new_room(self):
        ''' select a number from free number poll'''
        room = self.redis_connection.spop("room_number_free")
        if room == None:
            logging.info("WARNING: server has run out of room number"+self.room_statistic)
            raise AjaxError(6,"server can not create more room")
        self.redis_connection.sadd("room_number_used",room)
        logging.info(self.room_statistic)#
        return room
    def close_room(self,number=None):
        ''' put number into free poll '''
        self.redis_connection.smove("room_number_used","room_number_free",number)
        logging.info(self.room_statistic)#
        return number
    def room_number_init(self):
        ''' clean room number poll ,room_number_free / room_number_used'''
        self.redis_connection.delete("room_number_free")
        self.redis_connection.delete("room_number_used")
        for x in xrange(config.room_lower,config.room_upper+1):
           self.redis_connection.sadd("room_number_free",x)
    @property
    def room_statistic(self):
        total = config.room_upper - config.room_lower+1
        free  = self.redis_connection.scard("room_number_free")
        used  = self.redis_connection.scard("room_number_used")
        return "room statistics:\nroom capacity is %r\n%r\tfree\n%r\tused"%(total,free,used)
        
if __name__=="__main__":
    tornado.options.parse_command_line()
    httpserver = tornado.httpserver.HTTPServer(Application())
    httpserver.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()
