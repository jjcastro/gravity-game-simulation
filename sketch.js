function Body() {
// pixels per frame
    this.vel = createVector(1,0); 
    this.pos =  createVector(50,50);
    this.force =  createVector(0,0);
    this.mass = 1;

    this.move = function() {
      // velocity
      this.pos.add(this.vel);
      
      // acceleration
      var acc = p5.Vector.mult(this.force, this.mass);
      this.vel.add(acc);
    }

    this.drawDot = function() {
      ellipse(this.pos.x, this.pos.y, 5, 5);
    }
}

var array = [];

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  
  array.push(new Body());
  console.log(array)
  
  var sun = new Body();
  sun.pos.x = 200;
  sun.pos.y = 200;
  //sun.mass = 1;
  
  sun.vel.x = 0; 
  sun.vel.y = 0;
  
  array.push(sun);
}

function draw() {
  background(255);
  
  console.log(array);
  array.forEach(function(dot) {
    console.log(dot);
    dot.drawDot();
    
    array.forEach(function(dot2) {
      if (dot2 != dot) {
        var force = (dot.mass * dot2.mass) / dot.pos.dist(dot2.pos) * -1;
        dot2.force = p5.Vector.mult(p5.Vector.sub(dot2.pos, dot.pos).normalize(), force);
      }
    });
    
    dot.move();

  });
}