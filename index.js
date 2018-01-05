const express = require('express');
const baseAbsPath = __dirname + '/';
const app = express();
const path = require('path');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const port = 9899;
const rockets = [];

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

// Routing  
app.use(express.static(__dirname + '/public'));

//app.engine('html', ejs.__express);
app.set('view engine', 'html');

app.use('/rocket', function(req, res) {
  initSocket();
  res.send('ok');
})

var rocketNum = 0;

var Rocket = function(rocketId, intX, intY) {
  this.id = rocketId;
  this.x = intX;
  this.y = intY;
  this.angleDegrees = 0;
  this.speed = Math.ceil(Math.random() * 10);
  this.isRunning = false;
}

const initSocket = function() {
  var namespace = io.of('/rocket');
  namespace.on('connection', function(socket) {
    socket.on('login', function(rocketId, callback) {
      var rocket = new Rocket(rocketNum, 200, 200);
      rockets.push(rocket);
      socket.emit('changeId', rocketNum);
      socket.broadcast.emit('create', rocket);
      callback(rocket);
      rocketNum++;
    });
    socket.on('control', function(data) {
      rockets.forEach(function(rocket) {
        if (rocket.id == data.id) {
          rocket.x = data.x;
          rocket.y = data.y;
          rocket.angleDegrees = data.angleDegrees;
          rocket.isRunning = data.isRunning;
        }
      })
      socket.emit('sync', rockets);
    });

    setInterval(function() {
      socket.emit('sync', rockets);
    }, 5000)
  })
}
