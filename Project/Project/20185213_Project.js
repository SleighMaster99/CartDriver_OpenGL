var gl;
var points = [];
var colors = [];
var keyPressed = [];

var program;
var modelMatrix, modelViewMatrix, projectionMatrix;
var modelMatrixLoc, modelViewMatrixLoc, projectionMatrixLoc;

var eye = vec3(-40.0, 2.0, 0.0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);
var cameraVec = vec3(0.0, -0.25, -0.7071);

var newCartPosX = 0;
var newCartPosZ = 0;
var cartTheta = 0;


// Game variable
var speed = 0;
var maxSpeed = 0.1;
var accelation = 0.25;
var shifter = 'D';
var boostGage = 0;
var isBoost = false;
var windmillTheta = 0;
var r = 0;

// delta time
var prevTime = new Date();
let currTime = 0;
let deltaTime = 0;

// lap time
var lapStartTime = 0;
var lapFinishTime = 0;
var lapTime = 0;
var bestLapTime = 999;
var isMeasuring = false;
var isRacing = false;

// texture
var texCoords = [];

var program2;
var modelMatrixLoc2, modelViewMatrixLoc2
var fuColorLoc;

// collider
const objectPos = [];

function detectCollision(newPosX, newPosZ) {
    for (var index = 0; index < objectPos.length; index++) {
        r = Math.sqrt(Math.pow(objectPos[index][0] - newPosX, 2) + (Math.pow(objectPos[index][2] - newPosZ, 2)));

        if(r < 1.5)
            return true;
    }
    return false;
};

// car sound

window.onload = function init()
{
    var canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if( !gl ) {
        alert("WebGL isn't available!");
    }

    const CarSoundaudioPlayer = document.getElementById("CarSoundaudioPlayer");
    const BrakeaudioPlayer = document.getElementById("BrakeaudioPlayer");

    generateDriver();
    generateRedCube();
    generateWhiteCube();
    generateCart();
    generateBoostFire();
    generateWindmill();
    generateStartLine();
    generateTexGround(50);

    // Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.9, 1.0, 1.0, 1.0);

    // Enable hidden-surface removal
    gl.enable(gl.DEPTH_TEST);

    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(0.01, 1);

    // program : Phong Shading
    // Load shaders and initialize attribute buffers
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // Load the data into the GPU
    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    // Associate our shader variables with our data buffer
    var vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    // Create a buffer object, initialize it, and associate it with 
    // the associated attribute variable in our vertex shader
    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    modelViewMatrix = lookAt(eye, at, up);
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    
    // Perspective
    var aspectRatio = canvas.width / canvas.height;
    projectionMatrix = perspective(90, aspectRatio, 0.1, 1000);

    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    //////////////////////////////////////////텍스쳐 맵핑////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////
    // program2 : Texture Mapping
    
    program2 = initShaders(gl, "texMapVS", "texMapFS");
    gl.useProgram(program2);

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    vPosition = gl.getAttribLocation(program2, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    cBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    vColor = gl.getAttribLocation(program2, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var tBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    var vTexCoord = gl.getAttribLocation(program2, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexCoord);

    modelMatrixLoc2 = gl.getUniformLocation(program2, "modelMatrix");
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));

    modelViewMatrixLoc2 = gl.getUniformLocation(program2, "viewMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));

    projectionMatrixLoc = gl.getUniformLocation(program2, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    setTexture();
    generateStadiumCollider();
    
    //////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////

    // Event listeners for buttons
    window.onkeydown = function(event) {
        keyPressed[event.keyCode] = true;
    };

    window.onkeyup = function(event) {
        keyPressed[event.keyCode] = false;
        
        CarSoundaudioPlayer.pause();
        BrakeaudioPlayer.pause();
   };

    render();
};

function setTexture() {
    var image0 = new Image();
    image0.src = "../images/fColor.bmp"

    var texture0 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image0);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // 1. gl.NEAREST 2. gl.LINEAR
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // 1. gl.NEAREST 2. gl.LINEAR

    var image1 = new Image();
    image1.src = "../images/road1.bmp"

    var texture1 = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);

    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    currTime = new Date();
    deltaTime = (currTime.getTime() - prevTime.getTime()) / 1000;
    
    // Move
    GetKeyDown();

    if(isBoost)
        Boosting();
    
    if (maxSpeed < speed)
        speed -= accelation * 2 * deltaTime;

    document.getElementById("Booster").value = boostGage;

    if(cartTheta > 360)
        cartTheta -= 360;
    else if(cartTheta < -360)
        cartTheta += 360;

    // 키를 입력하지 않았을 때 자동 감속
    if(speed > 0 && shifter == 'D') {
        speed -= 0.008 * deltaTime;
    }
    else if (speed > 0 && shifter == 'R') {
        speed -= 0.008 * deltaTime;
    }
    else
        speed = 0;

    // 기어별 카메라 위처 이동
    if(shifter == 'D') {
        var newPosX = eye[0] + speed * cameraVec[0];
        var newPosZ = eye[2] + speed * cameraVec[2];
    
        if(!detectCollision(at[0], at[2])) {
            eye[0] = newPosX;
            eye[2] = newPosZ;
        }
    }
    else {
        var newPosX = eye[0] - speed * cameraVec[0];
        var newPosZ = eye[2] - speed * cameraVec[2];
        
        if(!detectCollision(at[0], at[2])) {
            eye[0] = newPosX;
            eye[2] = newPosZ;
        }
    }

    // camera
    at[0] = eye[0] + cameraVec[0];
    at[1] = eye[1] + cameraVec[1];
    at[2] = eye[2] + cameraVec[2];

    modelViewMatrix = lookAt(eye, at, up);

    
    ///////////////////////////////////////////
    ///////////////////////////////////////////

    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////
    
    gl.useProgram(program);
    fuColorLoc = gl.getUniformLocation(program, "fuColor");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.useProgram(program2);
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
    
    /////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////

    gl.useProgram(program);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    // Translate dirver, cart
    modelMatrix = mult(rotateY(cartTheta), modelMatrix);
    modelMatrix = mult(translate(at[0], 0, at[2]), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // draw a dirver
    gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.uniform4f(fuColorLoc, 0.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.LINE_LOOP, 0, 4);

    // draw a cart
    // cart body
    gl.uniform4f(fuColorLoc, 0.0, 0.0, 1.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 114, 36);
    // cart booster left
    gl.uniform4f(fuColorLoc, 0.5, 0.5, 0.5, 1.0);
    gl.drawArrays(gl.TRIANGLES, 144, 18);
    gl.uniform4f(fuColorLoc, 0.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 162, 6);
    gl.uniform4f(fuColorLoc, 0.5, 0.5, 0.5, 1.0);
    gl.drawArrays(gl.TRIANGLES, 168, 12);
    // cart booster right
    gl.uniform4f(fuColorLoc, 0.5, 0.5, 0.5, 1.0);
    gl.drawArrays(gl.TRIANGLES, 180, 18);
    gl.uniform4f(fuColorLoc, 0.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 198, 6);
    gl.uniform4f(fuColorLoc, 0.5, 0.5, 0.5, 1.0);
    gl.drawArrays(gl.TRIANGLES, 204, 12);

    //////////////////////////////////////////
    gl.useProgram(program2);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
    gl.uniform1i(gl.getUniformLocation(program2, "texture"), 0);

    // draw a boost
    if (isBoost) {
        gl.drawArrays(gl.TRIANGLE_FAN, 216, 6);
        gl.drawArrays(gl.TRIANGLE_FAN, 222, 6);
    }

    // draw a startline
    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    modelMatrix = mult(translate(-49, 0, -3), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, 282, 228)

    gl.useProgram(program);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    
    // draw a stadium
    track1();
    track2();
    track3();
    track4();
    track5();
    track6();
    track7();
    track8();
    track9();
    track10();
    track11();
    track12();
    track13();
    track14();
    track15();
    track16();

    // draw a windmill
    windmillTheta += 90 * deltaTime;
    DrawWindmill();

    ////////////////////////////////////////
    ////////////////////////////////////////
    // draw a ground
    gl.useProgram(program2);
    gl.uniformMatrix4fv(modelViewMatrixLoc2, false, flatten(modelViewMatrix));
    gl.uniform1i(gl.getUniformLocation(program2, "texture"), 1);

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc2, false, flatten(modelMatrix));
    gl.drawArrays(gl.TRIANGLES, 510, points.length);

    LapTimeMeasure();
    prevTime = currTime;

    requestAnimationFrame(render);
}

function GetKeyDown() {
    var sinTheta = Math.sin(1.5 * deltaTime);
    var cosTheta = Math.cos(1.5 * deltaTime);

    var press = false;

    if(keyPressed[38]) {       // 전진
        if (speed <= 0 && shifter == 'R')
            shifter = 'D';
        else if (speed >= 0 && shifter == 'R')
            speed -= accelation * deltaTime;

        if (!isBoost && boostGage <= 100)
            boostGage += 20 * deltaTime;

        if(shifter == 'D' && speed <= maxSpeed)
            speed += accelation * deltaTime;

        CarSoundaudioPlayer.play();

        press = true;
    }
    
    if (keyPressed[40]) {      // 후진
        if (speed <= 0 && shifter == 'D')
            shifter = 'R';
        else if (speed >= 0 && shifter == 'D')
            speed -= accelation * deltaTime;

        if(shifter == 'R' && speed <= maxSpeed / 2)
            speed += accelation * deltaTime;
        
        BrakeaudioPlayer.play();

        press = true;
    }
    
    if (keyPressed[37] && keyPressed[40] && shifter == 'R') {      // 후진 및 좌회전
        newVecX = cosTheta*cameraVec[0] - sinTheta*cameraVec[2];
        newVecZ = sinTheta*cameraVec[0] + cosTheta*cameraVec[2];
        cameraVec[0] = newVecX;
        cameraVec[2] = newVecZ;

        cartTheta += 85.95 * deltaTime;

        press = true;
    }
    else if (keyPressed[37]) {      // 좌회전
        newVecX = cosTheta*cameraVec[0] + sinTheta*cameraVec[2];
        newVecZ = -sinTheta*cameraVec[0] + cosTheta*cameraVec[2];
        cameraVec[0] = newVecX;
        cameraVec[2] = newVecZ;

        cartTheta -= 85.95 * deltaTime;

        press = true;
    }
    
    if (keyPressed[39] && keyPressed[40] && shifter == 'R') {      // 후진 및 우회전
        newVecX = cosTheta*cameraVec[0] + sinTheta*cameraVec[2];
        newVecZ = -sinTheta*cameraVec[0] + cosTheta*cameraVec[2] ;
        cameraVec[0] = newVecX;
        cameraVec[2] = newVecZ;

        cartTheta -= 85.95 * deltaTime;
        
        press = true;
    }
    else if (keyPressed[39]) {      // 우회전
        newVecX = cosTheta*cameraVec[0] - sinTheta*cameraVec[2];
        newVecZ = sinTheta*cameraVec[0] + cosTheta*cameraVec[2] ;
        cameraVec[0] = newVecX;
        cameraVec[2] = newVecZ;

        cartTheta += 85.95 * deltaTime;

        press = true;
    }

    if (keyPressed[17] && boostGage >= 100) {
        isBoost = true;
    }
}

function Boosting() {
    boostGage -= 70 * deltaTime;
    maxSpeed = 0.3;
    accelation = 0.5;

    if(boostGage <= 0) {
        maxSpeed = 0.1;
        accelation = 0.25;
        isBoost = false;
    }
}

function generateDriver() {
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
    quad(6, 5, 1, 2);
}

function generateCart() {
    // cart body
    cartquad(1, 0, 3, 2);
    cartquad(2, 3, 7, 6);
    cartquad(3, 0, 4, 7);
    cartquad(4, 5, 6, 7);
    cartquad(5, 4, 0, 1);
    cartquad(6, 5, 1, 2);

    // left booster
    leftBoosterquad(1, 0, 3, 2);
    leftBoosterquad(2, 3, 7, 6);
    leftBoosterquad(3, 0, 4, 7);
    leftBoosterbackquad(4, 5, 6, 7);
    leftBoosterquad(5, 4, 0, 1);
    leftBoosterquad(6, 5, 1, 2);

    // right booster
    rightBoosterquad(1, 0, 3, 2);
    rightBoosterquad(2, 3, 7, 6);
    rightBoosterquad(3, 0, 4, 7);
    rightBoosterbackquad(4, 5, 6, 7);
    rightBoosterquad(5, 4, 0, 1);
    rightBoosterquad(6, 5, 1, 2);
}

function generateBoostFire() {
    // left fire
    points.push(leftBoostFireVertexPos[0]);
    colors.push(vec4(1.0, 1.0, 0.0, 1.0));
    points.push(leftBoostFireVertexPos[1]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(leftBoostFireVertexPos[2]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(leftBoostFireVertexPos[3]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(leftBoostFireVertexPos[4]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(leftBoostFireVertexPos[1]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));

    // right fire
    points.push(rightBoostFireVertexPos[0]);
    colors.push(vec4(1.0, 1.0, 0.0, 1.0));
    points.push(rightBoostFireVertexPos[1]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(rightBoostFireVertexPos[2]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(rightBoostFireVertexPos[3]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(rightBoostFireVertexPos[4]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(rightBoostFireVertexPos[1]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
}

function generateRedCube() {
    RedCubequad(1, 0, 3, 2);
    RedCubequad(2, 3, 7, 6);
    RedCubequad(3, 0, 4, 7);
    RedCubequad(4, 5, 6, 7);
    RedCubequad(5, 4, 0, 1);
    RedCubequad(6, 5, 1, 2);
}

function generateWhiteCube() {
    WhiteCubequad(1, 0, 3, 2);
    WhiteCubequad(2, 3, 7, 6);
    WhiteCubequad(3, 0, 4, 7);
    WhiteCubequad(4, 5, 6, 7);
    WhiteCubequad(5, 4, 0, 1);
    WhiteCubequad(6, 5, 1, 2);
}

function generateWindmill() {
    // windmillBody
    Windmillquad(1, 0, 3, 2);
    Windmillquad(2, 3, 7, 6);
    Windmillquad(3, 0, 4, 7);
    Windmillquad(4, 5, 6, 7);
    Windmillquad(5, 4, 0, 1);
    Windmillquad(6, 5, 1, 2);

    // windmillRoof
    points.push(vec4(0, 20, 0));
    colors.push(vec4(1.0, 0.5, 0.5, 1.0));
    points.push(vec4(7, 15, -7));
    colors.push(vec4(1.0, 0.5, 0.5, 1.0));
    points.push(vec4(-7, 15, -7));
    colors.push(vec4(1.0, 0.5, 0.5, 1.0));
    points.push(vec4(-7, 15, 7));
    colors.push(vec4(1.0, 0.5, 0.5, 1.0));
    points.push(vec4(7, 15, 7));
    colors.push(vec4(1.0, 0.5, 0.5, 1.0));
    points.push(vec4(7, 15, -7));
    colors.push(vec4(1.0, 0.5, 0.5, 1.0));

    // windmill wing
    points.push(vec4(-1.25, 5, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
    points.push(vec4(-1.25, 25, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
    points.push(vec4(1.25, 5, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));

    points.push(vec4(-1.25, 25, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
    points.push(vec4(1.25, 5, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
    points.push(vec4(1.25, 25, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));

    points.push(vec4(-10, 13.75, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
    points.push(vec4(10, 13.75, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
    points.push(vec4(-10, 16.25, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));

    points.push(vec4(10, 13.75, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
    points.push(vec4(-10, 16.25, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
    points.push(vec4(10, 16.25, -8.5));
    colors.push(vec4(0.5882, 0.2941, 0.0, 1.0));
}

const vertexPos = [
    vec4(-0.5, 0.0, -1.75, 1.0),
    vec4( 0.5, 0.0, -1.75, 1.0),
    vec4( 0.5, 1.0, -1.75, 1.0),
    vec4(-0.5, 1.0, -1.75, 1.0),
    vec4(-0.5, 0.0, -0.75, 1.0),
    vec4( 0.5, 0.0, -0.75, 1.0),
    vec4( 0.5, 1.0, -0.75, 1.0),
    vec4(-0.5, 1.0, -0.75, 1.0)
];

const cartvertexPos = [
    vec4(-0.75, 0.01, -2.0, 1.0),
    vec4( 0.75, 0.01, -2.0, 1.0),
    vec4( 0.75, 0.25, -2.0, 1.0),
    vec4(-0.75, 0.25, -2.0, 1.0),
    vec4(-0.75, 0.01, -0.5, 1.0),
    vec4( 0.75, 0.01, -0.5, 1.0),
    vec4( 0.75, 0.75, -0.5, 1.0),
    vec4(-0.75, 0.75, -0.5, 1.0)
];

const leftBoostervertexPos = [
    vec4(-0.5, 0.31, -0.5, 1.0),    // 1
    vec4(-0.25, 0.31, -0.5, 1.0),   // 2
    vec4(-0.25, 0.46, -0.5, 1.0),   // 3
    vec4(-0.5, 0.46, -0.5, 1.0),    // 4
    vec4(-0.5, 0.31, -0.4, 1.0),   // 5
    vec4(-0.25, 0.31, -0.4, 1.0),  // 6
    vec4(-0.25, 0.46, -0.4, 1.0),  // 7
    vec4(-0.5, 0.46, -0.4, 1.0)    // 8
];

const rightBoostervertexPos = [
    vec4(0.5, 0.31, -0.5, 1.0),    // 1
    vec4(0.25, 0.31, -0.5, 1.0),   // 2
    vec4(0.25, 0.46, -0.5, 1.0),   // 3
    vec4(0.5, 0.46, -0.5, 1.0),    // 4
    vec4(0.5, 0.31, -0.4, 1.0),   // 5
    vec4(0.25, 0.31, -0.4, 1.0),  // 6
    vec4(0.25, 0.46, -0.4, 1.0),  // 7
    vec4(0.5, 0.46, -0.4, 1.0)    // 8
];

const leftBoostFireVertexPos = [
    vec4(-0.375, 0.385, -0.1, 1.0),     // 1
    vec4(-0.5, 0.46, -0.4, 1.0),        // 2
    vec4(-0.25, 0.46, -0.4, 1.0),       // 3
    vec4(-0.25, 0.31, -0.4, 1.0),       // 4
    vec4(-0.5, 0.31, -0.4, 1.0)         // 5
];

const rightBoostFireVertexPos = [
    vec4(0.375, 0.385, -0.1, 1.0),     // 1
    vec4(0.5, 0.46, -0.4, 1.0),        // 2
    vec4(0.25, 0.46, -0.4, 1.0),       // 3
    vec4(0.25, 0.31, -0.4, 1.0),       // 4
    vec4(0.5, 0.31, -0.4, 1.0)         // 5
];

const vertexColor = [
    vec4(0.0, 0.0, 0.0, 1.0),   // black
    vec4(1.0, 0.0, 0.0, 1.0),   // red
    vec4(1.0, 1.0, 0.0, 1.0),   // yellow
    vec4(0.0, 1.0, 0.0, 1.0),   // green
    vec4(0.0, 0.0, 0.0, 1.0),   // blue
    vec4(1.0, 0.0, 1.0, 1.0),   // magenta
    vec4(1.0, 1.0, 1.0, 1.0),   // white
    vec4(0.0, 1.0, 1.0, 1.0)    // cyan
];

const windmillVertexPos = [
    vec4(10, 0, 10, 1.0),    // 1
    vec4(-10, 0, 10, 1.0),   // 2
    vec4(-5, 15, 5, 1.0),   // 3
    vec4(5, 15, 5, 1.0),    // 4
    vec4(10, 0, -10, 1.0),   // 5
    vec4(-10, 0, -10, 1.0),  // 6
    vec4(-5, 15, -5, 1.0),  // 7
    vec4(5, 15, -5, 1.0)    // 8
];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function quad(a, b, c, d) {
    points.push(vertexPos[a]);
    colors.push(vertexColor[a]);
    points.push(vertexPos[b]);
    colors.push(vertexColor[b]);
    points.push(vertexPos[c]);
    colors.push(vertexColor[c]);
    points.push(vertexPos[a]);
    colors.push(vertexColor[a]);
    points.push(vertexPos[c]);
    colors.push(vertexColor[c]);
    points.push(vertexPos[d]);
    colors.push(vertexColor[d]);
}

function cartquad(a, b, c, d) {
    points.push(cartvertexPos[a]);
    colors.push(vec4(0.0, 0.0, 1.0, 1.0));
    points.push(cartvertexPos[b]);
    colors.push(vec4(0.0, 0.0, 1.0, 1.0));
    points.push(cartvertexPos[c]);
    colors.push(vec4(0.0, 0.0, 1.0, 1.0));
    points.push(cartvertexPos[a]);
    colors.push(vec4(0.0, 0.0, 1.0, 1.0));
    points.push(cartvertexPos[c]);
    colors.push(vec4(0.0, 0.0, 1.0, 1.0));
    points.push(cartvertexPos[d]);
    colors.push(vec4(0.0, 0.0, 1.0, 1.0));
}

function leftBoosterquad(a, b, c, d) {
    points.push(leftBoostervertexPos[a]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(leftBoostervertexPos[b]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(leftBoostervertexPos[c]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(leftBoostervertexPos[a]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(leftBoostervertexPos[c]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(leftBoostervertexPos[d]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
}

function leftBoosterbackquad(a, b, c, d) {
    points.push(leftBoostervertexPos[a]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(leftBoostervertexPos[b]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(leftBoostervertexPos[c]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(leftBoostervertexPos[a]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(leftBoostervertexPos[c]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(leftBoostervertexPos[d]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
}

function rightBoosterquad(a, b, c, d) {
    points.push(rightBoostervertexPos[a]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(rightBoostervertexPos[b]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(rightBoostervertexPos[c]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(rightBoostervertexPos[a]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(rightBoostervertexPos[c]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
    points.push(rightBoostervertexPos[d]);
    colors.push(vec4(0.5, 0.5, 0.5, 1.0));
}

function rightBoosterbackquad(a, b, c, d) {
    points.push(rightBoostervertexPos[a]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(rightBoostervertexPos[b]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(rightBoostervertexPos[c]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(rightBoostervertexPos[a]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(rightBoostervertexPos[c]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
    points.push(rightBoostervertexPos[d]);
    colors.push(vec4(0.0, 0.0, 0.0, 1.0));
}

function RedCubequad(a, b, c, d) {
    points.push(vertexPos[a]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(vertexPos[b]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(vertexPos[c]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(vertexPos[a]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(vertexPos[c]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
    points.push(vertexPos[d]);
    colors.push(vec4(1.0, 0.0, 0.0, 1.0));
}

function WhiteCubequad(a, b, c, d) {
    points.push(vertexPos[a]);
    colors.push(vec4(1.0, 1.0, 1.0, 1.0));
    points.push(vertexPos[b]);
    colors.push(vec4(1.0, 1.0, 1.0, 1.0));
    points.push(vertexPos[c]);
    colors.push(vec4(1.0, 1.0, 1.0, 1.0));
    points.push(vertexPos[a]);
    colors.push(vec4(1.0, 1.0, 1.0, 1.0));
    points.push(vertexPos[c]);
    colors.push(vec4(1.0, 1.0, 1.0, 1.0));
    points.push(vertexPos[d]);
    colors.push(vec4(1.0, 1.0, 1.0, 1.0));
}

function Windmillquad(a, b, c, d) {
    points.push(windmillVertexPos[a]);
    colors.push(vec4(1.0, 1.0, 0.5, 1.0));
    points.push(windmillVertexPos[b]);
    colors.push(vec4(1.0, 1.0, 0.5, 1.0));
    points.push(windmillVertexPos[c]);
    colors.push(vec4(1.0, 1.0, 0.5, 1.0));
    points.push(windmillVertexPos[a]);
    colors.push(vec4(1.0, 1.0, 0.5, 1.0));
    points.push(windmillVertexPos[c]);
    colors.push(vec4(1.0, 1.0, 0.5, 1.0));
    points.push(windmillVertexPos[d]);
    colors.push(vec4(1.0, 1.0, 0.5, 1.0));
}

function generateTexGround(scale) {
    for(var x=-scale; x<scale; x++) {
        for(var z=-scale; z<scale; z++) {
            // two triangles
            points.push(vec4(x, 0.1, z, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            texCoords.push(texCoord[0]);

            points.push(vec4(x, 0.1, z+1, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            texCoords.push(texCoord[1]);

            points.push(vec4(x+1, 0.1, z+1, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            texCoords.push(texCoord[2]);

            points.push(vec4(x, 0.1, z, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            texCoords.push(texCoord[0]);

            points.push(vec4(x+1, 0.1, z+1, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            texCoords.push(texCoord[2]);

            points.push(vec4(x+1, 0.1, z, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            texCoords.push(texCoord[3]);
        }
    }
}

function generateStartLine() {
    var x = 0;
    var z = 0;

    for(var i = 0; i < 38; i++) {
        points.push(vec4(x, 0.11, z));
        points.push(vec4(x, 0.11, z+1));
        points.push(vec4(x+1, 0.11, z+1));
        points.push(vec4(x, 0.11, z));
        points.push(vec4(x+1, 0.11, z+1, 1.0));
        points.push(vec4(x+1, 0.11, z, 1.0));

        if(x % 2 == 0 && z % 2 == 0) {
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
        }
        else if(x % 2 != 0 && z % 2 == 0){
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
        }
        else if(x % 2 == 0 && z % 2 != 0){
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
            colors.push(vec4(0.0, 0.0, 0.0, 1.0));
        }
        else {
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
            colors.push(vec4(1.0, 1.0, 1.0, 1.0));
        }

        x++;

        if(x > 0 && x % 19 == 0){
            x = 0;
            z++;
        }
    }
}

function track1() {
    var npX = -49.5;
    var npZ = 50;

    for(var i = 0; i < 50; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function track2() {
    var npX = -48.5;
    var npZ = -49.0;

    for(var i = 0; i < 49; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // redCube
    modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 36, 36);

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
}

function track3() {
    var npX = -29.5;
    var npZ = 40;

    for(var i = 0; i < 40; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function track4() {
    var npX = -15.5;
    var npZ = -10;

    for(var i = 0; i < 19; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 36, 36);

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
}

function track5() {
    var npX = -28.5;
    var npZ = 0.0;

    for(var i = 0; i < 30; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function track6() {
    var npX = 0.5;
    var npZ = -1.0;

    for(var i = 0; i < 13; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // whiteCube
    modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 72, 36);

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
}

function track7() {
    var npX = 0.5;
    var npZ = -31.5;

    for(var i = 0; i < 5; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function track8() {
    var npX = 15.5;
    var npZ = -10;

    for(var i = 0; i < 19; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // whiteCube
    modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 72, 36);

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
}

function track9() {
    var npX = 30.5;
    var npZ = -1.0;

    for(var i = 0; i < 13; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // whiteCube
    modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 72, 36);

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
}

function track10() {
    var npX = 30.5;
    var npZ = -31.5;

    for(var i = 0; i < 5; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function track11() {
    var npX = 49.5;
    var npZ = 50;

    for(var i = 0; i < 49; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

     // whiteCube
     modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
     gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
     gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
     gl.drawArrays(gl.TRIANGLES, 72, 36);

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
}

function track12() {
    var npX = 30.5;
    var npZ = 40;

    for(var i = 0; i < 20; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);
        
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);


        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function track13() {
    var npX = -48.5;
    var npZ = 50.0;

    for(var i = 0; i < 49; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);

        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // redCube
    modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 36, 36);

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
}

function track14() {
    var npX = 15.5;
    var npZ = 49;

    for(var i = 0; i < 20; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);
        
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);


        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function track15() {
    var npX = -20.5;
    var npZ = 10;

    for(var i = 0; i < 18; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);
        
        npX++;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);

        npX++;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function track16() {
    var npX = -20.5;
    var npZ = 49;

    for(var i = 0; i < 20; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 0.0, 0.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 36, 36);
        
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        gl.uniform4f(fuColorLoc, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.TRIANGLES, 72, 36);


        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function DrawWindmill() {
    var npX = 0;
    var npZ = 30;

    modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // body
    gl.uniform4f(fuColorLoc, 1.0, 1.0, 0.5, 1.0);
    gl.drawArrays(gl.TRIANGLES, 228, 36);

    // roof
    gl.uniform4f(fuColorLoc, 1.0, 0.5, 0.5, 1.0);
    gl.drawArrays(gl.TRIANGLE_FAN, 264, 6);
    gl.drawArrays(gl.TRIANGLE_STRIP, 265, 4);

    //wing
    gl.uniform4f(fuColorLoc, 0.5882, 0.2941, 0.0, 1.0);
    modelMatrix = mult(translate(npX, -15, -npZ), modelMatrix);
    modelMatrix = mult(rotateZ(windmillTheta), modelMatrix);
    modelMatrix = mult(translate(npX, 15, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    
    gl.drawArrays(gl.TRIANGLES, 270, 6);
    gl.drawArrays(gl.TRIANGLES, 276, 6);
}

function generateStadiumCollider() {
    gl.useProgram(program);

    // track1
    var npX = -49.5;
    var npZ = 49;

    for(var i = 0; i < 50; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));;

        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // track2
    var npX = -48.5;
    var npZ = -50.0;

    for(var i = 0; i < 49; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // redCube
    modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    objectPos.push(vec3(npX, 0, npZ));

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // track3
    var npX = -29.5;
    var npZ = 39;

    for(var i = 0; i < 40; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // track4
    var npX = -15.5;
    var npZ = -11;

    for(var i = 0; i < 19; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // redCube
    modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    objectPos.push(vec3(npX, 0, npZ));

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // track5
    var npX = -28.5;
    var npZ = -1;

    for(var i = 0; i < 30; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // track6
    var npX = 0.5;
    var npZ = -2;

    for(var i = 0; i < 13; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // whiteCube
    modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    objectPos.push(vec3(npX, 0, npZ));

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // track7
    var npX = 0.5;
    var npZ = -32.5;

    for(var i = 0; i < 5; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // track8
    var npX = 15.5;
    var npZ = -11;

    for(var i = 0; i < 19; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // whiteCube
    modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    objectPos.push(vec3(npX, 0, npZ));

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // track9
    var npX = 30.5;
    var npZ = -2.0;

    for(var i = 0; i < 13; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // whiteCube
    modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    objectPos.push(vec3(npX, 0, npZ));

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // track10
    var npX = 30.5;
    var npZ = -32.5;

    for(var i = 0; i < 5; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ -= 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // track11
    var npX = 49.5;
    var npZ = 49;

    for(var i = 0; i < 49; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

     // whiteCube
     modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
     gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

     objectPos.push(vec3(npX, 0, npZ));

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // track12
    var npX = 30.5;
    var npZ = 39;

    for(var i = 0; i < 20; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        
        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // trakc13
    var npX = -48.5;
    var npZ = 49;

    for(var i = 0; i < 49; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npX += 1;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // redCube
    modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    objectPos.push(vec3(npX, 0, npZ));

    modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

    // track14
    var npX = 15.5;
    var npZ = 48;

    for(var i = 0; i < 20; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        
        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // track15
    var npX = -20.5;
    var npZ = 9;

    for(var i = 0; i < 18; i++) {
        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        
        objectPos.push(vec3(npX, 0, npZ));
        npX++;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        objectPos.push(vec3(npX, 0, npZ));
        npX++;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }

    // track16
    var npX = -20.5;
    var npZ = 48;

    for(var i = 0; i < 20; i++) {
        // redCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
        
        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));

        // whiteCube
        modelMatrix = mult(translate(npX, 0.5, npZ), modelMatrix);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));


        objectPos.push(vec3(npX, 0, npZ));
        npZ--;

        modelMatrix = mat4(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        gl.uniformMatrix4fv(modelMatrixLoc, false, flatten(modelMatrix));
    }
}

function LapTimeMeasure() {
    document.getElementById("lapTime").innerText = lapTime.toFixed(2) + "초";

    if ((at[0] > -49 && at[0] < -29) && (at[2] > -2 && at[2] < -1)) {
        if(isMeasuring) {
            if (lapTime > 10 && lapTime < bestLapTime){
                bestLapTime = lapTime;
                document.getElementById("bestLapTime").innerText = bestLapTime.toFixed(2) + "초";
            }

            lapTime = 0;
        }
        else {
            isMeasuring = true;
        }
    }

    if (isMeasuring) {
        lapTime += deltaTime;
    }
}