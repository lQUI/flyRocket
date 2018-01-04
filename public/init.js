var domReady = function(callback) {
  document.readyState === "interactive" || document.readyState === "complete" ? callback() : document.addEventListener("DOMContentLoaded", callback);
};

domReady(function() {
  var canvas = document.getElementById("cvs");
  var p = new Processing(canvas, sketch);
// p.exit(); // To detach it.
});

function Rocket(imgRef, rocketId) {
  this.x = 200;
  this.y = 200;
  this.angleDegrees = 0; // In ProcessingJs, 0 degree is oriented processing.UP.
  this.bodyLength = 50;
  this.bodyHeight = 60;
  this.speed = 4;
  this.imgRef = imgRef;
  this.id = rocketId
  this.isRunning = false;
  this.setAngle = function(angleDegrees) {
    this.angleDegrees = angleDegrees;
  }
}

const drawRocket = function(processing, rocket) {
  const radianPerDegree = (processing.PI / 180);
  // Translate the origin of coordinate system to the current rocket.
  processing.translate(rocket.x, rocket.y);
  processing.rotate(rocket.angleDegrees * radianPerDegree);

  const translatedAnchorX = 0;
  const translatedAnchorY = 0;
  processing.image(rocket.imgRef, translatedAnchorX, translatedAnchorY, rocket.bodyLength, rocket.bodyHeight);

  // Reset the "accumulated rotation angle" and "accumulated translation".
  processing.rotate(-rocket.angleDegrees * radianPerDegree);
  processing.translate(-rocket.x, -rocket.y);
};

Window.prototype.Rocket = Rocket;

function initRocketControls(processing, rocket) {
  if (!processing.__keyPressed) {
    rocket.isRunning = false;
    socket.emit('control', {
      id: rocket.id,
      x: rocket.x,
      y: rocket.y,
      angleDegrees: rocket.angleDegrees,
      isRunning: rocket.isRunning
    });
    return;
  }

  rocket.isRunning = true;
  if (processing.keyCode === processing.UP) {
    rocket.setAngle(0);
    rocket.y = rocket.y - rocket.speed;
  }

  if (processing.keyCode === processing.DOWN) {
    rocket.setAngle(180);
    rocket.y = rocket.y + rocket.speed;
  }

  if (processing.keyCode === processing.LEFT) {
    rocket.setAngle(270);
    rocket.x = rocket.x - rocket.speed;
  }

  if (processing.keyCode === processing.RIGHT) {
    rocket.setAngle(90);
    rocket.x = rocket.x + rocket.speed;
  }
  socket.emit('control', {
    id: rocket.id,
    x: rocket.x,
    y: rocket.y,
    angleDegrees: rocket.angleDegrees,
    isRunning: rocket.isRunning
  });
}

Window.prototype.initRocketControls = initRocketControls;

function otherRocketControls(processing, rocket) {
  if (rocket.isRunning) {
    switch (rocket.angleDegrees) {
      case 0:
        rocket.y = rocket.y - rocket.speed;
        break;
      case 90:
        rocket.x = rocket.x + rocket.speed;
        break;
      case 180:
        rocket.y = rocket.y + rocket.speed;
        break;
      case 270:
        rocket.x = rocket.x - rocket.speed;
        break;
      default:
        return;
    }
  }
}

Window.prototype.otherRocketControls = otherRocketControls;

var socket = io('/rocket');

Window.prototype.socket = socket;

var sketch = new Processing.Sketch();
Window.prototype.sketch = sketch;
