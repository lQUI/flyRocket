sketch.attachFunction = function(processing) {
  // Processingjs script here, and ES6 syntax is supported by built-in polyfill.

  var anchorRocket = null;
  var singleAnimator = null;

  processing.setup = function() {
    processing.size(screen.width, screen.height);
    rocketImg = processing.loadImage("./space/rocket.png");
    anchorRocket = new Rocket(rocketImg);

    processing.imageMode(processing.CENTER);
    
    if (!singleAnimator || !singleAnimator.hasStarted || singleAnimator.isStopped) {
      singleAnimator = new Animator(processing, "./space/", "explosion", 15, 3, 24, -150);
      singleAnimator.start(anchorRocket.x, anchorRocket.y, anchorRocket.angleDegrees + 180, true, 5000 /* 5 seconds */);
    }
  };

  processing.draw = function() {
    processing.background(255, 255, 255);
    drawRocket(processing, anchorRocket);
    if (singleAnimator) {
      singleAnimator.display(anchorRocket.x, anchorRocket.y, anchorRocket.angleDegrees + 180);
    }
    initRocketControls(processing, anchorRocket);
  };
};
