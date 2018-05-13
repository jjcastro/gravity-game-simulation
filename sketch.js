var launching = false;
var lastPressed;
var lastReleased;

var launchSpeedFactor = 0.1;
var bigG = 20;
var density = 2;

var bodyColor = 230;

var showForces = true;

function Body() {
// pixels per frame
    this.vel = createVector(0,0); 
    this.pos =  createVector(0,0);
    this.force =  createVector(0,0);
    // both mass and mass
    this.mass = 5;
    this.fixed = false;

    this.move = function() {
      if (!this.fixed) {
        // velocity
        this.pos.add(this.vel);
        
        // acceleration
        var acc = p5.Vector.div(this.force, this.mass);
        this.vel.add(acc);
      }
    }

    this.size = function() {
      return this.mass / density;
    }

    this.drawDot = function() {
      fill(bodyColor);
      ellipse(this.pos.x, this.pos.y, this.size(), this.size());
      fill(255);

      if (showForces) {
        var forceV = p5.Vector.add(this.pos, p5.Vector.mult(this.force, 5));
        stroke(255, 0, 0);
        fill(255, 0, 0);

        line(this.pos.x, this.pos.y, forceV.x, forceV.y);
        ellipse(forceV.x, forceV.y, 2, 2);

        stroke(0,0,0);
        fill(255);
      }
    }

    this.interact = function(body2) {
      
      
    }
}

var bodies = [];

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);

  ellipseMode(CENTER);
  
  // bodies.push(new Body());

  // var b = new Body();
  // b.pos.x = 200;
  // b.pos.y = 200;
  // bodies.push(b);
  
  var sun = new Body();
  sun.pos.x = 200;
  sun.pos.y = 200;
  sun.mass = 200;
  sun.fixed = true;
  
  // sun.vel.x = 0; 
  // sun.vel.y = 0;
  // sun.mass = 200;
  // sun.mass = 100;
  
  // bodies.push(sun);
}

function mousePressed() {
  lastPressed = createVector(mouseX, mouseY);
  launching = true;
}

function mouseReleased() {
  if (launching) {
    var b = new Body();
    b.pos.x = lastPressed.x;
    b.pos.y = lastPressed.y;
    b.mass = 15;

    b.vel = createVector(
      lastPressed.x - mouseX,
      lastPressed.y - mouseY
    ); 

    if (b.vel.mag() < 5) {
      b.vel = createVector(0,0);
    } else {
      b.vel.mult(launchSpeedFactor);  
    }
    
    bodies.push(b);
  }

  launching = false;
}

function keyPressed() {
  if (keyCode == 70) {
    showForces = !showForces;
  }

}

function draw() {
  background(255);

  if (launching) {
    line(lastPressed.x, lastPressed.y, mouseX, mouseY);
    fill(bodyColor);
    ellipse(lastPressed.x, lastPressed.y, 5, 5);
    fill(255);
  }
  
  bodies.forEach(function(body1) {
    
    var totalForce = createVector(0,0);

    bodies.forEach(function(body2) {
      if (body2 != body1) {
        var distance = body1.pos.dist(body2.pos);
        if (distance > body1.size()/2) {
          var force = -1 * bigG * (body1.mass * body2.mass) / Math.pow(distance, 2);
          totalForce.add(p5.Vector.mult(p5.Vector.sub(body1.pos, body2.pos).normalize(), force));
        } else {
          var bigger = body1.mass >= body2.mass ? body1 : body2;
          var smaller = body1.mass < body2.mass ? body1 : body2;

          bigger.mass += smaller.mass;
          var index = bodies.indexOf(smaller);
          if (index > -1) {
            bodies.splice(index, 1);
          }
        }
      }
    });
    body1.force = totalForce;
    
    body1.move();
    body1.drawDot();
  });

  document.getElementById('bodies').innerHTML = bodies.length;
  // showForces = document.getElementById('forces').checked;

  // console.log($('#forces').checked());/
}