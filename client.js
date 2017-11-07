var socket = require('socket.io-client')('http://localhost:9999');

var userName = 'Bot_#1';

var currentRoomName;

socket.on('connect', function(){
  console.log('Connected to server.');
});
socket.on('disconnect', function(){
  currentRoomName = '';
  console.log('Disconnected from server.');
});

socket.emit('joinRoom', {'roomName':'random_chat_#1'});

socket.on('assignRoom', function(data){
  console.log('Server assigned room ['+data.roomName+']');
  currentRoomName = data.roomName;
});

socket.on('msg', function(data){
  console.log('Got message from ['+data.userName+']:\t'+data.message);
  sendResponseMessage(data.message);
});

function sendResponseMessage(message){
  socket.emit('msg', {message: message+' yourself!', userName: userName, roomName: currentRoomName});
}
