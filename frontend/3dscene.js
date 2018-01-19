var playerShape, playerBody, world, physicsMaterial, balls = [], ballMeshes = [], boxes = [], boxMeshes = [];
var container;
var video;
var screen, screenWidth = 16, screenHeight = 12;
var playerEntity = {};
var toBeRemovedBodies = [];

var camera, scene, renderer;
var cssRenderer, cssScene;
var geometry, material, mesh;
var controls, time = Date.now();

// Check PLC
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {
    var element = document.body;
    container = document.getElementById('container');

    var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            controls.enabled = true;
            document.getElementById('chat-textarea').style.visibility = 'hidden';
            document.getElementById('chat-name').style.visibility = 'hidden';
            document.getElementById('chat-button-use-chat').style.visibility = 'hidden';
            document.getElementById('chat-button-use-console').style.visibility = 'hidden';
            document.getElementById('chat-status').style.visibility = 'hidden';
            document.getElementById('chat-messages').style.background = 'transparent';
            document.getElementById('chat-messages').style.border = 'none';
            document.getElementById('chat-messages').style.overflowY = 'hidden';
        } else {
            controls.enabled = false;
            document.getElementById('chat-textarea').style.visibility = 'visible';
            document.getElementById('chat-name').style.visibility = 'visible';
            document.getElementById('chat-button-use-chat').style.visibility = 'visible';
            document.getElementById('chat-button-use-console').style.visibility = 'visible';
            document.getElementById('chat-status').style.visibility = 'visible';
            document.getElementById('chat-messages').style.background = 'rgba(110, 110, 110, 0.479)';
            document.getElementById('chat-messages').style.border = '1px solid rgb(161, 161, 161)';
            document.getElementById('chat-messages').style.overflowY = 'visible';
        }
    }

    var pointerlockerror = function (event) {
    }

    // Hook pointer lock state change events
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

    // Wake up 
    document.addEventListener("keydown", onDocumentKeyDown, false);
    function onDocumentKeyDown(event) {
        var keyCode = event.keyCode;
        playerBody.wakeUp();
    };
}

var Element = function (id, x, y, z, ry) {
    var div = document.createElement('div');
    div.id = 'video-placeholder';

    var object = new THREE.CSS3DObject(div);
    object.position.set(x, y, z);
    object.rotation.y = ry;

    return object;
};

initCannon();
init();
animate();

// Physics controller initialization
function initCannon() {
    // Setup our world
    world = new CANNON.World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;

    var solver = new CANNON.GSSolver();

    world.defaultContactMaterial.contactEquationStiffness = 1e9;
    world.defaultContactMaterial.contactEquationRelaxation = 4;

    solver.iterations = 7;
    solver.tolerance = 0.1;
    var split = true;
    if (split)
        world.solver = new CANNON.SplitSolver(solver);
    else
        world.solver = solver;

    world.gravity.set(0, -20, 0);
    world.broadphase = new CANNON.NaiveBroadphase();

    // Create a slippery material (friction coefficient = 0.0)
    physicsMaterial = new CANNON.Material("slipperyMaterial");
    var groundMaterial = new CANNON.Material("groundMaterial");
    var physicsContactMaterial = new CANNON.ContactMaterial(groundMaterial,
        physicsMaterial,
        {
            friction: 0.999, // friction coefficient
            restitution: 0.0
        }  // restitution
    );

    // We must add the contact materials to the world
    world.addContactMaterial(physicsContactMaterial);

    world.allowSleep = true;

    // Create a sphere (player)
    var mass = 5, radius = 1;
    playerShape = new CANNON.Sphere(radius);
    playerBody = new CANNON.Body({ mass: mass, material: physicsMaterial });
    playerBody.addShape(playerShape);
    playerBody.position.set(0, 5, 0);
    playerBody.linearDamping = 0.9;
    playerBody.allowSleep = true;
    playerBody.sleepSpeedLimit = 0.1;
    playerBody.sleepTimeLimit = 0;
    playerBody.linearFactor = new CANNON.Vec3(1, 1, 1);
    world.add(playerBody);

    // Create a plane
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.add(groundBody);
}

// Scene render initialization
function init() {

    var onKeyDown = function (event) {
        if (document.activeElement.className == 'main') {
            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }
    };
    document.addEventListener('keydown', onKeyDown, false);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    scene = new THREE.Scene();

    var ambient = new THREE.AmbientLight(0x222222);
    scene.add(ambient);

    light = new THREE.PointLight(0xffffff, 1, 100, 2);
    light.position.set(0, 10, 0);
    //light.target.position.set(0, 0, 0);
    if (true) {
        light.castShadow = true;

        light.shadowCameraNear = 20;
        light.shadowCameraFar = 50;//camera.far;
        light.shadowCameraFov = 40;

        light.shadowMapBias = 0.1;
        light.shadowMapDarkness = 0.7;
        light.shadowMapWidth = 2 * 512;
        light.shadowMapHeight = 2 * 512;

        //light.shadowCameraVisible = true;
    }
    scene.add(light);

    controls = new PointerLockControls(camera, playerBody);
    scene.add(controls.getObject());

    // floor
    geometry = new THREE.PlaneGeometry(40, 40, 50, 50);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI / 2));

    var texture = new THREE.TextureLoader().load("textures/grey_128.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(32, 32);
    material = new THREE.MeshPhongMaterial({ map: texture });

    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // renderer
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = 0;
    renderer.domElement.style.zIndex = 1;
    renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(renderer.domElement);

    // css
    cssScene = new THREE.Scene();
    cssRenderer = new THREE.CSS3DRenderer();
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.domElement.style.position = 'absolute';
    container.appendChild(cssRenderer.domElement);
    cssRenderer.domElement.appendChild(renderer.domElement);

    // plane behind video
    var planeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.1 });
    var planeGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
    screen = new THREE.Mesh(planeGeometry, planeMaterial);
    screen.position.y += screenHeight / 2;
    screen.position.z = -18.5;
    // add it to the standard (WebGL) scene
    scene.add(screen);

    // css iframe video
    var percentBorder = 0.05;
    video = new Element('opDlMeqRACI', 0, 0, -18.5, 0);
    video.scale.x /= (1 + percentBorder) * (480 / screenWidth);
    video.scale.y /= (1 + percentBorder) * (360 / screenHeight);
    video.position.y += 1;
    cssScene.add(video);

    window.addEventListener('resize', onWindowResize, false);

    // Creates cinema map
    createMap();
    setEnvironment();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

var dt = 1 / 60;

// Called every frame
function animate() {
    requestAnimationFrame(animate);
    if (controls.enabled) {
        world.step(dt);

        // Check if there are things that need removed
        if (toBeRemovedBodies.length > 0) {
            for (var i = 0; i < toBeRemovedBodies.length; i++) {
                var e = toBeRemovedBodies[i];
                ballMeshes.slice(ballMeshes.indexOf(e['mesh']));
                balls.slice(balls.indexOf(e['body']));
                world.remove(e['body']);
                scene.remove(e['mesh']);
            }
            toBeRemovedBodies = [];
        }

        // If player moved, notify other players
        if (socket !== undefined && playerBody.sleepState == 0) {
            var p = playerBody.position;
            socket.emit('user_3d_position', { x: p.x, y: p.y, z: p.z });
        }

        // Update ball positions
        for (var i = 0; i < balls.length; i++) {
            ballMeshes[i].position.copy(balls[i].position);
            ballMeshes[i].quaternion.copy(balls[i].quaternion);
        }

        // Update box positions
        for (var i = 0; i < boxes.length; i++) {
            boxMeshes[i].position.copy(boxes[i].position);
            boxMeshes[i].quaternion.copy(boxes[i].quaternion);
        }
    }

    controls.update(Date.now() - time);
    if (cssRenderer) {
        cssRenderer.render(cssScene, camera);
    }
    renderer.render(scene, camera);

    time = Date.now();
}

// Shooting balls (or perhaps other things)!
var points = [];
for ( var deg = 0; deg <= 180; deg += 6 ) {

    var rad = Math.PI * deg / 180;
    var point = new THREE.Vector2( ( 0.72 + .08 * Math.cos( rad ) ) * Math.sin( rad ), - Math.cos( rad ) ); // the "egg equation"
    //console.log( point ); // x-coord should be greater than zero to avoid degenerate triangles; it is not in this formula.
    points.push( point );

}

var ballShape = new CANNON.Sphere(0.2);
var ballGeometry = new THREE.LatheBufferGeometry(points, 32);
var shootDirection = new THREE.Vector3();
var shootVelo = 50;
var ballMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
function getShootDir(targetVec) {
    var vector = targetVec;
    targetVec.set(0, 0, 1);
    vector.unproject(camera);
    var ray = new THREE.Ray(playerBody.position, vector.sub(playerBody.position).normalize());
    targetVec.copy(ray.direction);
}

// Click to trigger shoot ball event
window.addEventListener("click", function (e) {
    if (controls.enabled == true) {
        var x = playerBody.position.x;
        var y = playerBody.position.y;
        var z = playerBody.position.z;
        var ballBody = new CANNON.Body({ mass: 1 });
        ballBody.addShape(ballShape);
        var ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
        ballMesh.scale.set(0.25,0.25,0.25);
        world.add(ballBody);
        scene.add(ballMesh);
        ballMesh.castShadow = true;
        ballMesh.receiveShadow = true;
        balls.push(ballBody);
        ballMeshes.push(ballMesh);
        getShootDir(shootDirection);
        ballBody.velocity.set(shootDirection.x * shootVelo,
            shootDirection.y * shootVelo,
            shootDirection.z * shootVelo);

        // Move the ball outside the player sphere
        x += shootDirection.x * (playerShape.radius * 1.02 + ballShape.radius);
        y += shootDirection.y * (playerShape.radius * 1.02 + ballShape.radius);
        z += shootDirection.z * (playerShape.radius * 1.02 + ballShape.radius);
        ballBody.position.set(x, y, z);
        ballMesh.position.set(x, y, z);

        ballBody.addEventListener('collide', function (e) {
            toBeRemovedBodies.push({ 'body': ballBody, 'mesh': ballMesh });
        });

        // Notify other players that ball is out
        if (socket !== undefined) {
            socket.emit('user_3d_throw_ball', { id: socket.id, position: { x: x, y: y, z: z }, shootDirection: { x: shootDirection.x, y: shootDirection.y, z: shootDirection.z } });
        }
    }
});

// Throws ball
function throwBall(position, direction) {
    var x = position.x;
    var y = position.y;
    var z = position.z;
    var ballBody = new CANNON.Body({ mass: 1 });
    ballBody.addShape(ballShape);
    var ballMesh = new THREE.Mesh(ballGeometry, material);
    ballMesh.scale.set(0.25,0.25,0.25);
    world.add(ballBody);
    scene.add(ballMesh);
    ballMesh.castShadow = true;
    ballMesh.receiveShadow = true;
    balls.push(ballBody);
    ballMeshes.push(ballMesh);
    var targetVec = new THREE.Vector3(direction.x, direction.y, direction.z);
    ballBody.velocity.set(targetVec.x * shootVelo,
        targetVec.y * shootVelo,
        targetVec.z * shootVelo);

    // Move the ball outside the player sphere
    x += direction.x * (playerShape.radius * 1.02 + ballShape.radius);
    y += direction.y * (playerShape.radius * 1.02 + ballShape.radius);
    z += direction.z * (playerShape.radius * 1.02 + ballShape.radius);
    ballBody.position.set(x, y, z);
    ballMesh.position.set(x, y, z);

    ballBody.addEventListener('collide', function (e) {
        toBeRemovedBodies.push({ 'body': ballBody, 'mesh': ballMesh });
    });
}

// Creates a new player that has just entered
function spawnNewPlayer(id, x, y, z, c) {
    // Create a sphere
    if (id in playerEntity) {
        return;
    }
    var mass = 100, radius = 1;
    var sphereShape = new CANNON.Sphere(radius);
    var sphereBody = new CANNON.Body({ mass: mass, material: physicsMaterial });
    sphereBody.addShape(sphereShape);
    sphereBody.position.set(x, y, z);
    var ballShape = new CANNON.Sphere(2);
    var ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);
    var material = new THREE.MeshLambertMaterial({ color: c });
    var ballMesh = new THREE.Mesh(ballGeometry, material);
    ballMesh.position.set(x, y, z);
    world.add(sphereBody);
    scene.add(ballMesh);
    playerEntity[id] = { 'body': sphereBody, 'mesh': ballMesh };
}

// Moves a certain player
function movePlayer(id, x, y, z) {
    var p = playerEntity[id];
    var b = p['body'];
    var m = p['mesh'];
    b.position.set(x, y, z);
    m.position.set(x, y, z);
}

// Deletes a certain player
function deletePlayer(id) {
    var p = playerEntity[id];
    var b = p['body'];
    var m = p['mesh'];
    world.remove(b);
    scene.remove(m);
}