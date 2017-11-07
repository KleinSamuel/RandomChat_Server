var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = 9999;

var debug = true;

var chatrooms = {};

var userdata = {};

initChatrooms();

io.on('connection', function(socket){
  console.log('a user connected ['+socket.id+']');

  socket.on('disconnect', function(){
    console.log('a user disconnected ['+socket.id+']');
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
    var flag = addUserToChatroom(roomName, socket.id);
    console.log('User requests to join room ['+roomName+'] --> '+flag);
    if(flag){
      socket.join(roomName);
      socket.emit('assignRoom', {'roomName':roomName});
    }
  });

  socket.on('joinRandomRoom', function(){
    var roomName = getRandomRoomName();
    var flag = addUserToChatroom(roomName, socket.id);
    console.log('User requests to join room ['+roomName+'] --> '+flag);
    if(flag){
      socket.join(roomName);
      socket.emit('assignRoom', {'roomName':roomName});
    }
  });

  socket.on('requestRoomList', function(){
    socket.emit('receiveRoomList', getRoomList());
  });

  socket.on('msg', function(data){
    var message = data.message;
    var roomName = data.roomName;
    console.log('<'+socket.id+'> ['+data.userName+'] in room ['+roomName+'] says ['+message+']');
    socket.broadcast.in(roomName).emit('msg', data);
  });

  socket.on('leaveRoom', function(data){
    removeUserFromChatroom(data.roomName, socket.id);
  });

});

/* User Object */
function User(name){
  this.name = name
}

function addUser(name){
  users.push(new User(name));
  console.log("Current users: "+users.length);
}

function removeUser(name){
  for (var i = 0; i < users.length; i++) {
    if(users[i].name == name){
      users.splice(i, 1);
      break;
    }
  }
  console.log("Current users: "+users.length);
}

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
      limit: room.limit
    }
    out.push(tmp);
  }
  return out;
}

/* add a given user to a given chatroom */
function addUserToChatroom(roomName, userName){
  flag = false;
  /* check if room exists */
  if(roomName in chatrooms){
    var room = chatrooms[roomName];
    /* check if room is full */
    if(room.users.length < room.limit){
      room.users.push(userName);
      flag = true;
    }
  }
  printChatrooms();
  return flag;
}

/* remove a given user from given chatroom */
function removeUserFromChatroom(roomName, userName){

  console.log('Remove user ['+userName+'] from room ['+roomName+']');

  if(roomName in chatrooms){
    var room = chatrooms[roomName];
    var index = room.users.indexOf(userName);
    if(index > -1){
      chatrooms[roomName].users.splice(index, 1);
    }
  }
  printChatrooms();
}

function removeUserFromAllChatrooms(userName){
  console.log('Remove user ['+userName+'] from all chatrooms');
  for(var i in chatrooms){
    room = chatrooms[i];
    var index = room.users.indexOf(userName);
    if(index > -1){
      room.users.splice(index, 1);
    }
  }
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

/* used for testing to init empty chatrooms */
function initChatrooms(){
  addChatroom("random chat #1", 5);
  addChatroom("random chat #2", 10);
  addChatroom("random chat #3", 15);
}

server.listen(port, function(){
  console.log("RandomChat Server started on port "+port);
});
