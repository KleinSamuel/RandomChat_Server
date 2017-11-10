var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = 9999;

var debug = true;

/* Key = roomName, Value = limit, userlist with socketIDs */
var chatrooms = {};
/* Key = socketID, Value = name, roomName */
var userdata = {};

initChatrooms();

io.on('connection', function(socket){
  console.log('a user connected ['+socket.id+']');

  socket.on('disconnect', function(){
    console.log('a user disconnected ['+socket.id+']');
    if(userdata[socket.id]){
      socket.broadcast.in(userdata[socket.id].room).emit('userLeftRoom', {userName: userdata[socket.id].name, socketID: socket.id});
    }
    removeUserFromAllChatrooms(socket.id);
  });

  socket.on('login', function(data){
    username = data.username;
    password = data.password;
    console.log("Login data: "+data);
    socket.emit('loginResponse', {'response':'OK'});
  });

  socket.on('joinRoom', function(data){
    var roomName = data.roomName;
    var userName = data.userName;
    var flag = addUserToChatroom(roomName, socket.id, userName);
    console.log('User requests to join room ['+roomName+'] --> '+flag);
    if(flag){
      socket.join(roomName);
      var usersInRoom = getUsernamesForRoom(roomName, socket.id);
      socket.emit('assignRoom', {'roomName':roomName, 'limit': chatrooms[roomName].limit, 'userlist':usersInRoom});
      socket.broadcast.in(roomName).emit('userJoinedRoom', {userName: userName, socketID: socket.id});
    }
  });

  socket.on('joinRandomRoom', function(data){
    var roomName = getRandomRoomName();
    var userName = data.userName;
    var flag = addUserToChatroom(roomName, socket.id, userName);
    console.log('User requests to join room ['+roomName+'] --> '+flag);
    if(flag){
      socket.join(roomName);
      var usersInRoom = getUsernamesForRoom(roomName, socket.id);
      socket.emit('assignRoom', {'roomName':roomName, 'limit': chatrooms[roomName].limit, 'userlist':usersInRoom});
      socket.broadcast.in(roomName).emit('userJoinedRoom', {userName: userName, socketID: socket.id});
    }
  });

  socket.on('requestRoomList', function(){
    socket.emit('receiveRoomList', getRoomList());
  });

  socket.on('msg', function(data){
    var message = data.message;
    var roomName = data.roomName;
    console.log('<'+socket.id+'> ['+data.userName+'] in room ['+roomName+'] says ['+message+']');
    data.socketID = socket.id;
    socket.broadcast.in(roomName).emit('msg', data);
  });

  socket.on('leaveRoom', function(data){
    socket.broadcast.in(data.roomName).emit('userLeftRoom', {userName: userdata[socket.id].name, socketID: socket.id});
    removeUserFromChatroom(data.roomName, socket.id);
  });

});

/* add a new chatroom */
function addChatroom(name, limit){
  var tmp = {
    limit: limit,
    users: []
  }
  chatrooms[name] = tmp;
}

function getRandomRoomName(){
  var listOfEmpty = [];
  var out = "";
  /* get all chatroom which are not full */
  for(var i in chatrooms){
    var room = chatrooms[i];
    if(room.users.length < room.limit){
      listOfEmpty.push(i);
    }
  }
  /* get a random chatroom */
  if(listOfEmpty.length > 0){
    var len = listOfEmpty.length;
    var rnd = Math.floor(Math.random()*len);
    out = listOfEmpty[rnd];
  }
  return out;
}

function getRoomList(){
  var out = [];
  for(var i in chatrooms){
    var room = chatrooms[i];
    var tmp = {
      name: i,
      limit: room.limit,
      load: room.users.length
    }
    out.push(tmp);
  }
  return out;
}

/* add a given user to a given chatroom */
function addUserToChatroom(roomName, socketID, userName){
  flag = false;
  /* check if room exists */
  if(roomName in chatrooms){
    var room = chatrooms[roomName];
    /* check if room is full */
    if(room.users.length < room.limit){
      room.users.push(socketID);
      addUserToUserdata(socketID, userName, roomName);
      flag = true;
    }
  }
  printChatrooms();
  return flag;
}

/* remove a given user from given chatroom */
function removeUserFromChatroom(roomName, socketID){

  console.log('Remove user ['+socketID+'] from room ['+roomName+']');

  if(roomName in chatrooms){
    var room = chatrooms[roomName];
    var index = room.users.indexOf(socketID);
    if(index > -1){
      chatrooms[roomName].users.splice(index, 1);
      removeUserFromUserdata(socketID);
    }
  }
  printChatrooms();
}

function removeUserFromAllChatrooms(socketID){
  console.log('Remove user ['+socketID+'] from all chatrooms');
  for(var i in chatrooms){
    room = chatrooms[i];
    var index = room.users.indexOf(socketID);
    if(index > -1){
      room.users.splice(index, 1);
    }
  }
  removeUserFromUserdata(socketID);
}

/* add user to userdata */
function addUserToUserdata(socketID, userName, roomName){
  userdata[socketID] = {room: roomName, name: userName};
  printUserdata();
}

/* remove user from userdata */
function removeUserFromUserdata(socketID){
  delete userdata[socketID];
  printUserdata();
}

function getUsernamesForRoom(roomName, socketID){
  var out = [];
  for(var i = 0; i < chatrooms[roomName].users.length; i++){
    var userSocketId = chatrooms[roomName].users[i];
    if(userSocketId != socketID){
      var tmp = {
        socketID: userSocketId,
        name: userdata[userSocketId].name
      };
      console.log(userdata[userSocketId]);
      out.push(tmp);
    }
  }
  return out;
}

function printChatrooms(){
  if(!debug){
    return;
  }
  console.log('###');
  for (var i in chatrooms){
    var room = chatrooms[i];
    console.log('Room Name:\t'+i);
    console.log('Room Limit:\t'+room.limit);
    console.log('User:');
    for (var j = 0; j < room.users.length; j++) {
      console.log('\t'+room.users[j]);
    }
    console.log('###');
  }
}

function printUserdata(){
  console.log('### USERDATA ###');
  for(var i in userdata){
    var user = userdata[i];
    console.log('User ID:\t'+i);
    console.log('User Name:\t'+user.name);
    console.log('User Room:\t'+user.room);
    console.log('###');
  }
}

/* used for testing to init empty chatrooms */
function initChatrooms(){
  addChatroom("random chat #1", 5);
  addChatroom("random chat #2", 10);
  addChatroom("random chat #3", 15);
}

server.listen(port, function(){
  console.log("RandomChat Server started on port "+port);
});
