sketch.attachFunction = function(processing) {
  // Processingjs script here, and ES6 syntax is supported by built-in polyfill.

  var anchorRocket = null;
  var singleAnimator = null;
  var rockets = new Map;
  var rocketId = Math.ceil(Math.random() * 1000);

  processing.setup = function() {
    processing.size(screen.width, screen.height);
    rocketImg = processing.loadImage("./space/rocket.png");
    anchorRocket = new Rocket(rocketImg, rocketId);

    socket.emit('login', rocketId, function(rocket) {
      rocketId = rocket.id;
      rockets.set(rocketId, anchorRocket);
      anchorRocket.id = rocketId;
      anchorRocket.speed = rocket.speed;

      processing.imageMode(processing.CENTER);

      if (!singleAnimator || !singleAnimator.hasStarted || singleAnimator.isStopped) {
        singleAnimator = new Animator(processing, "./space/", "explosion", 15, 3, 24, -150);
        singleAnimator.start(anchorRocket.x, anchorRocket.y, anchorRocket.angleDegrees + 180, true);
      }

    });
    socket.on('create', function(rocket) {
      var anotherRocket = new Rocket(rocketImg, rocket.id);
      rockets.set(rocket.id, anotherRocket);
    });
    socket.on('sync', function(newRockets) {
      newRockets.forEach(function(rocket) {
        if (rocket.id != rocketId) {
          var oldRocket = rockets.get(rocket.id);
          if (oldRocket != null) {
            oldRocket.isRunning = rocket.isRunning;
            oldRocket.x = rocket.x;
            oldRocket.setAngle(rocket.angleDegrees);
            oldRocket.y = rocket.y;
          } else {
            newRocket = new Rocket(rocketImg, rocket.id);
            rockets.set(rocket.id, newRocket);
          }
        }
      })
    });
  };

  processing.draw = function() {
    processing.background(255, 255, 255);
    rockets.forEach(function(rocket, id, map) {
      drawRocket(processing, rocket);
      if (singleAnimator) {
        singleAnimator.display(rocket.x, rocket.y, rocket.angleDegrees + 180);
      }
      if (rocket.id != rocketId) {
        console.log(rocket);
        otherRocketControls(processing, rocket);
      }
    });
    initRocketControls(processing, anchorRocket);
  };
};
