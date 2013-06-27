class TypelessException(Exception):
    '''This class is the root Exception of all TyplessException'''
    def __init__(self, **format_args):
        Exception.__init__(self)
        self.format_args = format_args
        if not self.format_args:
            self.format_args['state'] = "7"
            self.format_args['msg'] = "Typeless Exception"
        self.format_args['msg'] = self.format_args['msg'] % format_args


    def __str__(self):
        #print self.format_args
        return self.format_args["msg"]


    def toResult(self,act=None):
        '''format the TypelessException to a json string that can be write back 
        to client'''
        if act==None:
            return '{"state":"%(state)s","data":{"why":"%(msg)s"}}' % self.format_args
        else:
            return ('{"state":"%(state)s","data":{"why":"%(msg)s"},' % self.format_args)+('"act":"%s"}'%act)



class NoSuchAct(TypelessException):
    '''All error in room'''
    def __init__(self, act, state="6", msg="No act named '%(act)s'"):
        TypelessException.__init__(self, act=act, state=state, msg=msg)


class RoomError(TypelessException):
    '''All error in room'''
    def __init__(self, room_num, state="7", msg="The room %(room_num)s got error"
            , **format_args):
        TypelessException.__init__(self, state=state, msg=msg,
                room_num=room_num, **format_args)



class RoomNotExist(RoomError):
    def __init__(self, room_num, state="6", msg="The room %(room_num)s is not exist"):
        RoomError.__init__(self, room_num=room_num, state=state, msg=msg)



class UserNotInRoom(RoomError):
    def __init__(self, room_num, username, 
            state="6", msg="The user %(username)s is not in room %(room_num)s"):
        RoomError.__init__(self, room_num=room_num, state=state, msg=msg,
                username=username)



class NoAvailableRoom(RoomError):
    def __init__(self, room_num="null", state="6", 
            msg="Room maximum number is reached. No available room for using"):
        RoomError.__init__(self, room_num=room_num, state=state, msg=msg)



class GuestError(TypelessException):
    '''All error happened on Guest'''
    def __init__(self, username, state="7", msg="The guest %(username)s got error"):
        TypelessException.__init__(self, username=username, state=state, msg=msg)



class GuestOfflineError(GuestError):
    '''This Guest not online'''

    def __init__(self, username, state="6", msg="The user %(username)s is not online"):
        GuestError.__init__(self, username=username, state=state, msg=msg)
    


class AjaxError(TypelessException):
    '''errors happened when handle ajax requests'''
    def __init__(self,state="2", msg="Error when handle ajax requests"):
        TypelessException.__init__(self, state=state, msg=msg)



# The unit test, not very completive
if __name__ == '__main__':
    errors = [
            TypelessException(),
            TypelessException(state = "1", msg="TypelessException"),
            NoSuchAct("create_room"),
            RoomError("8888"),
            RoomNotExist("8888"),
            UserNotInRoom("8888", "Debug_username"),
            NoAvailableRoom(),
            GuestError("Debug_username"),
            GuestOfflineError("Debug_username"),
            AjaxError()
            ]

    for e in errors:
        print " ========================================================================= "
        print "who", repr(e)
        print "msg", e
        print "json", e.toResult()
