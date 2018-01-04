function Animator(processing, dirWithSlash, imageNamePrefix, count, ndigits, fps, offsetInOrientation) {
  this.fps = fps;
  if (undefined === this.fps || null === this.fps) {
    this.fps = 24;
  }
  this.offsetInOrientation = offsetInOrientation;
  if (undefined === this.offsetInOrientation || null === this.offsetInOrientation) {
    this.offsetInOrientation = 0;
  }
  this.frame = 0;
  this.imageCount = count;
  this.images = [];
  this.hasStarted = false;
  this.isStopped = false;
  this.startedTs = null;
  this.cx = null;
  this.cy = null;
  this.orientationDegrees = null;

  this.scheduledRepeatedly = false;
  this.maxDurationMillis = null;

  for (let i = 0; i < this.imageCount; i++) {
    // Use nf() to number format 'i' into four digits
    var filename = dirWithSlash + imageNamePrefix + processing.nf(i, ndigits) + ".gif";
    this.images.push(processing.loadImage(filename));
  }

  this.start = function(cx, cy, orientationDegrees, scheduledRepeatedly, maxDurationMillis) {
    var ins = this;
    var startedTs = Date.now();
    ins.startedTs = startedTs;
    ins.hasStarted = true;
    if (undefined !== cx && null !== cx && undefined !== cy && null !== cy && "number" == typeof cx && "number" == typeof cy) {
      this.cx = cx;
      this.cy = cy;
    }

    if (undefined !== orientationDegrees && null !== orientationDegrees && "number" == typeof orientationDegrees) {
      this.orientationDegrees = orientationDegrees;
    }
    
    if (true == scheduledRepeatedly) {
      this.scheduledRepeatedly = true;
    }
    
    if (undefined !== maxDurationMillis && null !== maxDurationMillis && "number" == typeof maxDurationMillis) {
      this.maxDurationMillis = maxDurationMillis;
    }
    var millisPerFrame = parseInt(1000 / fps);
    var itv = setInterval(function() {
      if (ins.isStopped) {
        clearInterval(itv);
      }
      var elapsedMs = (Date.now() - startedTs);
      ins.frame = parseInt(elapsedMs / millisPerFrame);
      if (ins.frame >= ins.imageCount) {
        if (true != ins.scheduledRepeatedly) {
          ins.isStopped = true;
          clearInterval(itv);
        } else {
          ins.frame = (ins.frame % ins.fps);
        }
      }
    }, millisPerFrame);

    if (null !== ins.maxDurationMillis) {
      var timeout = setTimeout(function() {
        ins.isStopped = true; 
        clearTimeout(timeout); 
      }, ins.maxDurationMillis);
    }
  };

  this.stop = function() {
    var ins = this;
    ins.isStopped = true;
    ins.frame = 0;
  }

  this.display = function(cx, cy, orientationDegrees) {
    var ins = this;
    if (ins.isStopped) {
      return;
    }
    if (undefined === ins.startedTs || null === ins.startedTs) {
      return;
    }
    if (ins.frame >= ins.imageCount) {
      // Redundant ensurance.
      return;
    }
    if (undefined === cx || null === cx) {
      cx = this.cx;
    }
    if (undefined === cy || null === cy) {
      cy = this.cy;
    }
    if (undefined === orientationDegrees || null === orientationDegrees) {
      orientationDegrees = this.orientationDegrees;
    }

    var radianPerDegree = (processing.PI / 180);
    var radians = (orientationDegrees * radianPerDegree);
    // W.r.t. current origin.
    processing.imageMode(processing.CENTER);
    processing.translate(cx, cy);
    processing.rotate(radians);
    processing.image(ins.images[ins.frame], 0, this.offsetInOrientation);
    processing.rotate(-radians);
    processing.translate(-cx, -cy);
  };

  this.getWidth = function() {
    return this.images[0].width;
  };
}

Window.prototype.Animator = Animator;
