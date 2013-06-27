class ipcFilter:
    '''The class for making ipc communicate msg. usage:
        
        Make ipc msg
        >>> # Wrong protocol call
        >>> ipcFilter("dsa", a=1,b=2,c=3),
        >>> # create room if set room_num="null", server will assgin a room_num
        >>> ipcFilter("create_room", room_num="8888"),
        >>> # broadcast message
        >>> ipcFilter("broadcast", room_num="8888", msg="Hello!"),
        >>> # remove user from room
        >>> ipcFilter("remove_user", room_num="8888", username="Debug")

        use ipc msg
        >>> print ipcFilter("create_room", room_num="8888").msg
        '''

    def __init__(self, act, **args):
        try:
            processor = getattr(self, "_%s_proc" % act)
            processor(**args)
        except AttributeError:
            self.msg = None


    def _create_room_proc(self, room_num):
        self.msg = '{"act":"create_room", "room_num":"%s"}' % room_num

    def _broadcast_proc(self, room_num, msg):
        self.msg = '{"act":"broadcast", "room_num":"%s", "msg":"%s"}' % (room_num, msg)

    def _remove_user_proc(self, room_num, username):
        self.msg = '{"act":"remove_user", "room_num":"%s", "username":"%s"}' % (room_num, username)



if __name__ == "__main__":
    l = [
            # Wrong protocol call
            ipcFilter("dsa", a=1,b=2,c=3),
            # create room
            ipcFilter("create_room", room_num="8888"),
            # broadcast message
            ipcFilter("broadcast", room_num="8888", msg="Hello!"),
            # remove user from room
            ipcFilter("remove_user", room_num="8888", username="Debug")
        ]

    for obj in l:
        print obj.msg

