var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var port = 9999;

io.on('connection', function(socket){
  console.log("a user connected");

  socket.on('disconnect', function(){
    console.log("a user disconnected");
  });

  socket.on('login', function(data){

    username = data.username;
    password = data.password;

    console.log("Login data: "+data);
    socket.emit('loginResponse', {'response':'OK'});
  });

});

app.get('/hello', function(req, res){
  console.log("hello world");
});

server.listen(port, function(){
  console.log("RandomChat Server started on port "+port);
});
