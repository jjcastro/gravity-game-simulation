
var gl;

var bigG = 1;

var selected = 0;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var keys = {
  w:  119,
  a: 97,
  s: 115,
  d: 100,
  n: 110,
  m: 109,
  q: 113,
  e: 101
}

var currentStage = 0;

var stage = {
  goal: {},
  source: {}
};

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl");
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {
    }
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}

function handleKeyPress(event) {
  if (event.keyCode == keys.n) {
    selected = (selected+1) % objects.length;
  } else if (event.keyCode == keys.e) {
    objects[selected].pos[1]++;
  } else if (event.keyCode == keys.a) {
    objects[selected].pos[0]--;
  } else if (event.keyCode == keys.q) {
    objects[selected].pos[1]--;
  } else if (event.keyCode == keys.d) {
    objects[selected].pos[0]++;
  } else if (event.keyCode == keys.w) {
    objects[selected].pos[2]--;
  } else if (event.keyCode == keys.s) {
    objects[selected].pos[2]++;
  } else if (event.keyCode == keys.m) {
    throwProjectile();
  }

  console.log(event.keyCode);
}

function throwProjectile() {
  projectile = new GravityBody();
  projectile.pos = vec3.clone(stage.source.pos);
  projectile.vel = vec3.clone(stage.source.vel);
  projectile.mass = 5;
  projectile.fixed = false;
  // objects.push(projectile);
  
}

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

var mouseRotationMatrix = mat4.create();
mat4.identity(mouseRotationMatrix);

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {
    mouseDown = false;
}


function handleMouseMove(event) {
    if (!mouseDown) {
        return;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - lastMouseX;
    var newRotationMatrix = mat4.create();
    mat4.identity(newRotationMatrix);
    // Update: mat4.rotate(newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]); mat4.rotate() API has changed to mat4.rotate(out, a, rad, axis)
    // where out is the receiving matrix and a is the matrix to rotate.
    mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaX / 10), [0, 1, 0]);

    var deltaY = newY - lastMouseY;
    // mat4.rotate(newRotationMatrix, newRotationMatrix, degToRad(deltaY / 10), [1, 0, 0]);

    // Update: mat4.multiply(newRotationMatrix, mouseRotationMatrix, mouseRotationMatrix); API has changed.
    mat4.multiply(mouseRotationMatrix, newRotationMatrix, mouseRotationMatrix);

    lastMouseX = newX;
    lastMouseY = newY;
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
    shaderProgram.useLightingUniform = gl.getUniformLocation(shaderProgram, "uUseLighting");
    shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
    shaderProgram.pointLightingLocationUniform = gl.getUniformLocation(shaderProgram, "uPointLightingLocation");
    shaderProgram.pointLightingColorUniform = gl.getUniformLocation(shaderProgram, "uPointLightingColor");
}


function handleLoadedTexture(texture) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
}


var moonTexture;
var moonPinkTexture;
var planeTexture;

function initTextures() {
    moonTexture = gl.createTexture();
    moonTexture.image = new Image();
    moonTexture.image.onload = function () {
        handleLoadedTexture(moonTexture)
    };
    moonTexture.image.src = "moon.gif";

    moonPinkTexture = gl.createTexture();
    moonPinkTexture.image = new Image();
    moonPinkTexture.image.onload = function () {
        handleLoadedTexture(moonPinkTexture)
    };
    moonPinkTexture.image.src = "moonpink.gif";

    moonGreenTexture = gl.createTexture();
    moonGreenTexture.image = new Image();
    moonGreenTexture.image.onload = function () {
        handleLoadedTexture(moonGreenTexture)
    };
    moonGreenTexture.image.src = "moongreen.gif";

    moonYellowTexture = gl.createTexture();
    moonYellowTexture.image = new Image();
    moonYellowTexture.image.onload = function () {
        handleLoadedTexture(moonYellowTexture)
    };
    moonYellowTexture.image.src = "moonyellow.gif";

    planeTexture = gl.createTexture();
    planeTexture.image = new Image();
    planeTexture.image.onload = function () {
        handleLoadedTexture(planeTexture)
    };
    planeTexture.image.src = "crate.gif";
}


var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
    var copy = mat4.create();
    // Update: mat4.set(mvMatrix, copy); mat4.set() was removed from gl-matrix, use mat4.copy().
    mat4.copy(copy, mvMatrix);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

    var normalMatrix = mat3.create();
    // Update:
    //   mat4.toInverseMat3(mvMatrix, normalMatrix);
    //   mat3.transpose(normalMatrix);
    // These two methods have been combined into a single method in the mat3 class, mat3.normalFromMat4().
    mat3.normalFromMat4(normalMatrix, mvMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}


function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

var moonVertexPositionBuffer;
var moonVertexNormalBuffer;
var moonVertexTextureCoordBuffer;
var moonVertexIndexBuffer;

var planeVertexPositionBuffer;
var planeVertexNormalBuffer;
var planeVertexTextureCoordBuffer;
var planeVertexIndexBuffer;

function initBuffers() {
    var latitudeBands = 30;
    var longitudeBands = 30;
    var radius = 2;

    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);
            textureCoordData.push(u);
            textureCoordData.push(v);
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
        }
    }

    var indexData = [];
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    moonVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    moonVertexNormalBuffer.itemSize = 3;
    moonVertexNormalBuffer.numItems = normalData.length / 3;

    moonVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
    moonVertexTextureCoordBuffer.itemSize = 2;
    moonVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    moonVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    moonVertexPositionBuffer.itemSize = 3;
    moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

    moonVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
    moonVertexIndexBuffer.itemSize = 1;
    moonVertexIndexBuffer.numItems = indexData.length;

    // PLANE

    planeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexPositionBuffer);
    vertices = [
        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    planeVertexPositionBuffer.itemSize = 3;
    planeVertexPositionBuffer.numItems = 4;

    planeVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexNormalBuffer);
    var vertexNormals = [
        // Top face
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0,
         0.0,  1.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
    planeVertexNormalBuffer.itemSize = 3;
    planeVertexNormalBuffer.numItems = 4;

    planeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexTextureCoordBuffer);
    var textureCoords = [

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    planeVertexTextureCoordBuffer.itemSize = 2;
    planeVertexTextureCoordBuffer.numItems = 4;

    planeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeVertexIndexBuffer);
    var planeVertexIndices = [
        0, 1, 2,      0, 2, 3  // Top face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(planeVertexIndices), gl.STATIC_DRAW);
    planeVertexIndexBuffer.itemSize = 1;
    planeVertexIndexBuffer.numItems = 6;
}

function distance(body1, body2) {
  var dist = vec3.dist(body1.pos, body2.pos);
  dist -= (2 * body2.scale);
  dist -= (2 * body1.scale);

  return dist > 0 ? dist : 0;
}

var moonAngle = 180;
var objects = [];
var projectile = null;
var goal = null;

function initWorldObjects() {

  goal = new GravityBody();

  stage.source.pos = [7,
  getRandomInt(-5, 5),
  getRandomInt(-5, 5)];
  stage.source.vel = [-2,0,0];

  goal.pos = [
    getRandomInt(-7, 7),
    getRandomInt(-7, 7),
    -7
  ];

  objects = [];

  var objN = getRandomInt(2, 5);
  console.log(objN);


  // add fixed bodies
  var newBody = new GravityBody();
  newBody.pos = [
    getRandomInt(-7, 7),
    getRandomInt(-7, 7),
    getRandomInt(-7, 7)
  ];
  objects.push(newBody);
  newBody.mass = 5;

  newBody.mass = getRandomInt(1, 10);
  newBody.scale = newBody.mass / 10;

  var newBody2 = new GravityBody();
  newBody2.pos = [
    getRandomInt(-7, 7),
    getRandomInt(-7, 7),
    getRandomInt(-7, 7)
  ];
  objects.push(newBody2);

  // for

  // console.log(distance(newBody, newBody2));

  // var newBody = new GravityBody();
  // newBody.pos = [i,0,i];
  // objects.push(newBody);

}

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Update: mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix); mat4.perspective() API has changed.
  mat4.perspective (pMatrix, 45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);

  var lighting = true;
  gl.uniform1i(shaderProgram.useLightingUniform, lighting);
  if (lighting) {
      gl.uniform3f(
          shaderProgram.ambientColorUniform,
          0.6,
          0.6,
          0.6
      );

      if (projectile) {
        gl.uniform3f(
          shaderProgram.pointLightingLocationUniform,
            projectile.pos[0],
            projectile.pos[1],
            projectile.pos[2]
        );
      } else {
        gl.uniform3f(
          shaderProgram.pointLightingLocationUniform,
            -9999,
            -9999,
            -9999
        );
      }
      

      gl.uniform3f(
          shaderProgram.pointLightingColorUniform,
          0.2,
          0.2,
          0.2
      );
  }

  mat4.identity(mvMatrix);

  // Update: mat4.translate(mvMatrix, [0, 0, -20]); mat4.translate() API has changed to mat4.translate(out, a, v)
  // where out is the receiving matrix, a is the matrix to translate, and v is the vector to translate by. z and
  // DOM element "lightPositionZ" altered to approximate original scene.
  mat4.translate(mvMatrix, mvMatrix, [0, 0, -16]);
  mat4.multiply(mvMatrix, mvMatrix, mouseRotationMatrix);

  mvPushMatrix();
  mat4.scale(mvMatrix, mvMatrix, [7.5, 7.5, 7.5]);
  mat4.translate(mvMatrix, mvMatrix, [0, -2, 0]);
  drawPlane();
  mvPopMatrix();

  mvPushMatrix();
  mat4.rotate(mvMatrix, mvMatrix, degToRad(90), [1, 0, 0]);
  mat4.scale(mvMatrix, mvMatrix, [7.5, 7.5, 7.5]);
  mat4.translate(mvMatrix, mvMatrix, [0, -2, 0]);
  drawPlane();
  mvPopMatrix();

  mvPushMatrix();
  mat4.rotate(mvMatrix, mvMatrix, degToRad(90), [0, 0, 1]);
  mat4.scale(mvMatrix, mvMatrix, [7.5, 7.5, 7.5]);
  mat4.translate(mvMatrix, mvMatrix, [0, -2, 0]);
  drawPlane();
  mvPopMatrix();

  for (var i=0; i < objects.length; i++) {
    objects[i].draw(i != selected ? 0 : 2);
  }

  if (projectile != null) {
    projectile.draw(3);
  }

  goal.draw(1);
}


function drawMoon(texture) {
  // mvPushMatrix();
  // // Update: mat4.rotate(mvMatrix, degToRad(moonAngle), [0, 1, 0]); mat4.rotate() API has changed to mat4.rotate(out, a, rad, axis)
  // // where out is the receiving matrix and a is the matrix to rotate.
  // mat4.rotate(mvMatrix, mvMatrix, degToRad(moonAngle), [0, 1, 0]);
  // mat4.translate(mvMatrix, mvMatrix, [10, 0, 0]);
  gl.activeTexture(gl.TEXTURE0);

  if (texture == 0) {
    gl.bindTexture(gl.TEXTURE_2D, moonTexture);
  } else if (texture == 1) {
    gl.bindTexture(gl.TEXTURE_2D, moonPinkTexture);
  } else if (texture == 2) {
    gl.bindTexture(gl.TEXTURE_2D, moonGreenTexture);
  } else if (texture == 3) {
    gl.bindTexture(gl.TEXTURE_2D, moonYellowTexture);
  }

  gl.uniform1i(shaderProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, moonVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, moonVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
  // mvPopMatrix();
}

function drawPlane() {

  

  // All stars spin around the Z axis at the same rate
  // mat4.rotate(mvMatrix, mvMatrix, degToRad(spin), [0.0, 0.0, 1.0]);
  

  
  gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, planeTexture);

  gl.uniform1i(shaderProgram.samplerUniform, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, planeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, planeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, planeVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, planeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, planeVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, planeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function GravityBody(vel, pos, force, mass, fixed) {
    // pixels per frame
    this.vel   = vec3.create();
    this.pos   = vec3.create();
    this.force = vec3.create();

    this.scale = 0.15;
    // both mass and mass
    this.mass = 5;
    this.fixed = true;
}

GravityBody.prototype.size = function() {
  return this.mass / density;
}

GravityBody.prototype.move = function() {
  var totalForce = vec3.create();

  if (playing && !this.fixed) {

    for (var i=0; i < objects.length; i++) {

      if (this != objects[i]) {
        
        var distance = vec3.sqrDist(this.pos, objects[i].pos);
        // if (distance > objects[i]1.size()/2) {
        var force = -1 * bigG * (this.mass * objects[i].mass) / distance;

        var unitV = vec3.create();
        vec3.sub(unitV, this.pos, objects[i].pos);
        vec3.normalize(unitV, unitV);

        // console.log(unitV);

        var scaled = vec3.create();
        vec3.scale(scaled, unitV, force);
        // console.log(sc)

        vec3.add(totalForce, scaled, totalForce);
      }
    }

    this.force = totalForce;

  

    // var speedFactor = slowMotion ? slowFactor : 1;
    // vec3.scale(this.vel, this.vel, speedFactor);

    var speedFactor = 0.05;
    
    // velocity
    var scaled = vec3.create();
    vec3.scale(scaled, this.vel, speedFactor);
    vec3.add(this.pos, scaled, this.pos);
    
    // acceleration
    var acc = vec3.create();
    vec3.scale(acc, this.force, 1 / this.mass);
    vec3.add(this.vel, acc, this.vel);
  }

  
}

var playing = true;

GravityBody.prototype.draw = function(selected) {
  mvPushMatrix();


  // mat4.rotate(mvMatrix, mvMatrix, degToRad(this.angle), [0.0, 1.0, 0.0]);
  mat4.translate(mvMatrix, mvMatrix, [this.pos[0], this.pos[1], this.pos[2]]);

  // All stars spin around the Z axis at the same rate
  // mat4.rotate(mvMatrix, mvMatrix, degToRad(spin), [0.0, 0.0, 1.0]);
  mat4.scale(mvMatrix, mvMatrix, [this.scale, this.scale, this.scale]);

  drawMoon(selected);
  
  mvPopMatrix();
};


var speed = 200 / 1000;
GravityBody.prototype.animate = function (elapsedTime) {
    this.angle += this.rotationSpeed * speed * elapsedTime;

    // Decrease the distance, resetting the shape to the outside of
    // the spiral if it's at the center.
    this.dist -= 0.01 * speed * elapsedTime;
    if (this.dist < 0.1) {
        this.dist += 5.0;
    }
};

var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
      var elapsed = timeNow - lastTime;

      moonAngle += 0.05 * elapsed;
      // planeAngle += 0.05 * elapsed;
      for (var i in objects) {
        objects[i].move();
      }
      if (projectile != null) {
        projectile.move();
      }
      
    }
    lastTime = timeNow;
}

function tick() {
    requestAnimFrame(tick);
    drawScene();
    animate();
    verifyWin();
}

function verifyWin() {
  if (projectile != null) {
    if (vec3.dist(goal.pos, projectile.pos) < 1) {
      console.log('yes!');
      $('#counter').html(parseInt($('#counter').text()) + 1);
      initWorldObjects();
    }
  }
}


function webGLStart() {
    var canvas = document.getElementById("lesson12-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTextures();
    initWorldObjects();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    canvas.onmousedown = handleMouseDown;
        document.onmouseup = handleMouseUp;
        document.onmousemove = handleMouseMove;

    document.onkeypress = handleKeyPress;

    // var base = [0,0,1];

    // vec3.add(base, [1,0,0], base);

    // console.log(base);

    tick();
}
