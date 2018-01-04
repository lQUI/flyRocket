const Server = require('socket.io');

const singleton = Symbol();
const singletonEnforcer = Symbol();
const roomMap = new Map();
const port = process.env.PORT || 3000;

class ChatRoomSIOUtils {
  static get instance() {
    if (!this[singleton]) {
      this[singleton] = new ChatRoomSIOUtils(singletonEnforcer);
    }
    return this[singleton];
  }

  constructor(enforcer) {
    if (enforcer != singletonEnforcer)
      throw "Cannot construct singleton";
    // Chatroom
    var numUsers = 0;
    this.generatePlayerId = generatePlayerId;
    this.io = null;
    this.rooms = [];
    this.instance = this;
  }
}

ChatRoomSIOUtils.room = function(roomId, roomNamespace) {
  this.id = roomId;
  this.players = [];
  this.tanks = [];
  this.playerIds = [111];
  this.status = 0;
  this.map = {};
  this.roomNamespace = roomNamespace;
}

ChatRoomSIOUtils.user = function(roomId, socket) {
  this.roomId = roomId;
  this.socket = socket;
  this.playerId = ChatRoomSIOUtils.instance.generatePlayerId();
  this.tank = new ChatRoomSIOUtils.tank(Math.floor(Math.random() * 300), 0, this.playerId);
}

ChatRoomSIOUtils.tank = function(initX, initY, playerId) {
  this.id = playerId;
  this.initX = initX;
  this.initY = initY;
  this.HP = 10;
}


ChatRoomSIOUtils.prototype.room = function(roomId, roomNamespace) {
  this.rooms[roomId] = new ChatRoomSIOUtils.room(roomId, roomNamespace);
  return this.rooms[roomId];
}

const generatePlayerId = function(roomId) {
  const playerId = Math.ceil(Math.random() * 1000);
  return playerId;
}

ChatRoomSIOUtils.prototype.createRoom = function(roomId, creatorId) {
  const instance = this;
  let room = this.rooms[roomId];
  console.log('first', room)
  let uid = 0;
  if (room == null || room == undefined) {
    try {
      roomNamespace = instance.io.of('/chatRoom/' + roomId);
      room = instance.room(roomId, roomNamespace);
      console.log('init room', room);
      roomNamespace.on('connection', function(socket) {
        socket.use((packages, next) => {
          if (socket.status != 1 && packages[0] != "login")
            next(new Error('Not allowed to access!'));
          next();
        });
        const user = new ChatRoomSIOUtils.user(roomId, socket);

        // when the client emits 'new message', this listens and executes
        socket.on('new message', user.send.bind(user));

        socket.on('login', user.login.bind(user));

        //socket.on('gameStart', user.gameStart.bind(user));

        // when the user disconnects.. perform this
        socket.on('disconnect', user.disconnect.bind(user));

        socket.on('left', user.left.bind(user));

      });
    } catch (err) {
      console.log(err.stack);
    }
  }

  if (room == null || room == undefined)
    return new Promise(function(resolve, reject) {
      resolve(false)
    });

  return new Promise(function(resolve, reject) {
    resolve(true)
  });

}

ChatRoomSIOUtils.user.prototype.send = function(data) {
  // we tell the client to execute 'new message'
  console.log('new message is running ', data);
  this.socket.to(this.roomId).emit('new message', {
    userName: this.userName,
    message: data
  })
}

ChatRoomSIOUtils.room.prototype.gameStart = function() {
  console.log('gameStartRoom:');
  this.players.forEach((user) => {
    console.log('the tank is', user.tank);
    this.tanks.push(user.tank);
    user.socket.on('control', function(tank) {
      user.tank = tank;
    })
  });

  this.emit('createLocalTank', {
    tanks: this.tanks
  })

  this.loopEmit();
}

ChatRoomSIOUtils.room.prototype.loopEmit = function() {
  setInterval(() => {
    this.emit('frame', {
      tanks: this.tanks
    })
  }, 1000);
}

ChatRoomSIOUtils.user.prototype.login = function(userName) {
  console.log('add user is running ', userName);
  var room = ChatRoomSIOUtils.instance.rooms[this.roomId];

  if (room == null) return; //The rom is not exisiting
  if (room.playerIds[this.playerId] != null) {
    this.socket.emit('defaults', 'The playerId is not invalide');
    return this.socket.disconnect(true);
  }
  if (room.players.length >= 2) {
    this.socket.emit('defaults', '房间人数已满');
    return this.socket.disconnect(true);
  }

  // we store the userName in the this session for this client
  room.players.push(this);
  console.log('login room:', this.socket.id);
  this.userName = userName;
  this.status = 1;
  this.socket.emit('login', {
    numUsers: room.players.length
  });
  this.socket.join(this.roomId)
  console.log('the user status', this.status);
  // echo globally (all clients) that a person has connected
  room.emit('user joined', {
    userName: userName,
    numUsers: room.players.length
  });

  if (room.players.length == 2) {
    console.log('The game will start soon!');
    room.emit('ready', 'The game will start soon');
    setTimeout(function() {
      room.gameStart();
    }, 2000);
  }
}


ChatRoomSIOUtils.user.prototype.disconnect = function(error) {
  console.log('disconnect is running ');
  if (this.status == 1) {
    this.status = 0;
    var room = ChatRoomSIOUtils.instance.rooms[this.roomId];
    for (var i = 0; i < room.players.length; i++) {
      if (this.playerId == room.players[i].playerId) {
        room.tanks.splice(i, 1);
        room.players.splice(i, 1);
      }
    }
    // echo globally that this client has left
    this.socket.emit('user left', {
      userName: this.userName,
      numUsers: this.players ? this.players.length : 0
    }, false);
  }
}

ChatRoomSIOUtils.user.prototype.left = function(playerId) {
  if (this.status == 1) {
    for (var i = 0; i < room.players.length; i++) {
      var room = ChatRoomSIOUtils.instance.rooms[this.roomId];
      if (playerId == room.players[i]) {
        room.tanks.splice(i, 1);
        room.players.splice(i, 1);
      }
    }
    this.socket.disconnect(true);
  }
}

ChatRoomSIOUtils.room.prototype.emit = function(method, packet, exclude = false) {
  console.log('the room is emit,the roomId is', this.id);
  if (!exclude) {
    return this.roomNamespace.to(this.id).emit(method, packet);
  }
  for (let id in this.players) {
    const user = this.players[id];
    if (!user) continue;
    if (exclude == id) continue;
    user.socket.emit(method, packet);
  }
}

module.exports = ChatRoomSIOUtils;
