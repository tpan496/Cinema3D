var sphereShape, sphereBody, world, physicsMaterial, walls = [], balls = [], ballMeshes = [], boxes = [], boxMeshes = [];
var container;
var video;
var screen, screenWidth = 16, screenHeight = 12;
var playerEntity = {};
var toBeRemovedBodies = [];

var camera, scene, renderer;
var cssRenderer, cssScene;
var geometry, material, mesh;
var controls, time = Date.now();

var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');


// Check PLC
var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {
    var element = document.body;
    container = document.getElementById('container');

    var pointerlockchange = function (event) {
        if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            controls.enabled = true;
            blocker.style.display = 'none';
        } else {
            controls.enabled = false;

            blocker.style.display = '-webkit-box';
            blocker.style.display = '-moz-box';
            blocker.style.display = 'box';

            instructions.style.display = '';
        }
    }

    var pointerlockerror = function (event) {
        instructions.style.display = '';
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
        sphereBody.wakeUp();
    };


    instructions.addEventListener('click', function (event) {
        instructions.style.display = 'none';

        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

        if (/Firefox/i.test(navigator.userAgent)) {
            var fullscreenchange = function (event) {
                if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
                    document.removeEventListener('fullscreenchange', fullscreenchange);
                    document.removeEventListener('mozfullscreenchange', fullscreenchange);

                    element.requestPointerLock();
                }
            }

            document.addEventListener('fullscreenchange', fullscreenchange, false);
            document.addEventListener('mozfullscreenchange', fullscreenchange, false);

            element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
            element.requestFullscreen();
        } else {
            element.requestPointerLock();
        }
    }, false);
} else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
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
            friction: 0.3, // friction coefficient
            restitution: 0.3
        }  // restitution
    );

    // We must add the contact materials to the world
    world.addContactMaterial(physicsContactMaterial);

    world.allowSleep = true;

    // Create a sphere
    var mass = 100, radius = 2;
    sphereShape = new CANNON.Sphere(radius);
    sphereBody = new CANNON.Body({ mass: mass, material: physicsMaterial });
    sphereBody.addShape(sphereShape);
    sphereBody.position.set(0, 5, 0);
    sphereBody.linearDamping = 0.9;
    sphereBody.allowSleep = true;
    sphereBody.sleepSpeedLimit = 0.1;
    sphereBody.sleepTimeLimit = 0;
    world.add(sphereBody);

    // Create a plane
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.add(groundBody);
}

function init() {

    var onKeyDown = function (event) {
        if (instructions.style.display != 'none') {
            instructions.style.display = 'none';

            // Ask the browser to lock the pointer
            element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
            element.requestPointerLock();
        }
    };
    document.addEventListener('keydown', onKeyDown, false);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

    scene = new THREE.Scene();

    var ambient = new THREE.AmbientLight(0x111111);
    scene.add(ambient);

    light = new THREE.SpotLight(0xffffff);
    light.position.set(0, 50, 0);
    light.target.position.set(0, 0, 0);
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

    controls = new PointerLockControls(camera, sphereBody);
    scene.add(controls.getObject());

    // floor
    geometry = new THREE.PlaneGeometry(300, 300, 50, 50);
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(- Math.PI / 2));

    material = new THREE.MeshLambertMaterial({ color: 0xdddddd });

    mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    //renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.setClearColor( scene.fog.color, 1 );
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

    var planeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.1 });
    var planeGeometry = new THREE.PlaneGeometry(screenWidth, screenHeight);
    screen = new THREE.Mesh(planeGeometry, planeMaterial);
    screen.position.y += screenHeight / 2;
    screen.position.z = -18.5;
    // add it to the standard (WebGL) scene
    scene.add(screen);

    var percentBorder = 0.05;
    video = new Element('opDlMeqRACI', 0, 0, -18.5, 0);
    video.scale.x /= (1 + percentBorder) * (480 / screenWidth);
    video.scale.y /= (1 + percentBorder) * (360 / screenHeight);
    video.position.y += 1;
    cssScene.add(video);

    window.addEventListener('resize', onWindowResize, false);

    // walls
    var sideMaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    var createWall = function (x, y, z, w, h, l, m) {
        var wallShape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, l / 2));
        var wallBody = new CANNON.Body({ mass: 0 });
        wallBody.addShape(wallShape);
        var wallGeometry = new THREE.BoxGeometry(w, h, l);
        var wallMesh = new THREE.Mesh(wallGeometry, m);
        world.add(wallBody);
        scene.add(wallMesh);
        wallBody.position.set(x, y, z);
        wallMesh.position.set(x, y, z);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        //boxes.push(wallBody);
        //boxMeshes.push(wallMesh);
        return { 'mesh': wallMesh, 'body': wallBody };
    };
    createWall(0, 20, 20, 40, 40, 2, material);
    createWall(0, 20, -20, 40, 40, 2, material);
    var w3 = createWall(20, 20, 0, 40, 40, 2, sideMaterial);
    w3['body'].quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    w3['mesh'].position.copy(w3['body'].position);
    w3['mesh'].quaternion.copy(w3['body'].quaternion);
    var w4 = createWall(-20, 20, 0, 40, 40, 2, sideMaterial);
    w4['body'].quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    w4['mesh'].position.copy(w4['body'].position);
    w4['mesh'].quaternion.copy(w4['body'].quaternion);
    var ceiling = createWall(0, 40, 0, 40, 40, 2, material);
    ceiling['body'].quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    ceiling['mesh'].position.copy(ceiling['body'].position);
    ceiling['mesh'].quaternion.copy(ceiling['body'].quaternion);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
}

var dt = 1 / 60;
function animate() {
    requestAnimationFrame(animate);
    if (controls.enabled) {
        world.step(dt);
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
        if (socket !== undefined && sphereBody.sleepState == 0) {
            var p = sphereBody.position;
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

var ballShape = new CANNON.Sphere(0.2);
var ballGeometry = new THREE.SphereGeometry(ballShape.radius, 32, 32);
var shootDirection = new THREE.Vector3();
var shootVelo = 15;
var projector = new THREE.Projector();
function getShootDir(targetVec) {
    var vector = targetVec;
    targetVec.set(0, 0, 1);
    projector.unprojectVector(vector, camera);
    var ray = new THREE.Ray(sphereBody.position, vector.sub(sphereBody.position).normalize());
    targetVec.copy(ray.direction);
}

window.addEventListener("click", function (e) {
    if (controls.enabled == true) {
        var x = sphereBody.position.x;
        var y = sphereBody.position.y;
        var z = sphereBody.position.z;
        var ballBody = new CANNON.Body({ mass: 1 });
        ballBody.addShape(ballShape);
        var ballMesh = new THREE.Mesh(ballGeometry, material);
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
        x += shootDirection.x * (sphereShape.radius * 1.02 + ballShape.radius);
        y += shootDirection.y * (sphereShape.radius * 1.02 + ballShape.radius);
        z += shootDirection.z * (sphereShape.radius * 1.02 + ballShape.radius);
        ballBody.position.set(x, y, z);
        ballMesh.position.set(x, y, z);

        ballBody.addEventListener('collide', function (e) {
            toBeRemovedBodies.push({ 'body': ballBody, 'mesh': ballMesh });
        });
        if(socket !== undefined){
            socket.emit('user_3d_throw_ball', {id: socket.id, position: {x:x, y:y, z:z}, shootDirection: {x:shootDirection.x, y:shootDirection.y, z:shootDirection.z}});
        }
    }
});

function throwBall(position, direction) {
    var x = position.x;
    var y = position.y;
    var z = position.z;
    var ballBody = new CANNON.Body({ mass: 1 });
    ballBody.addShape(ballShape);
    var ballMesh = new THREE.Mesh(ballGeometry, material);
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
    x += direction.x * (sphereShape.radius * 1.02 + ballShape.radius);
    y += direction.y * (sphereShape.radius * 1.02 + ballShape.radius);
    z += direction.z * (sphereShape.radius * 1.02 + ballShape.radius);
    ballBody.position.set(x, y, z);
    ballMesh.position.set(x, y, z);

    ballBody.addEventListener('collide', function (e) {
        toBeRemovedBodies.push({ 'body': ballBody, 'mesh': ballMesh });
    });
}
function spawnNewPlayer(id, x, y, z, c) {
    // Create a sphere
    if (id in playerEntity) {
        return;
    }
    var mass = 100, radius = 2;
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

function movePlayer(id, x, y, z) {
    var p = playerEntity[id];
    var b = p['body'];
    var m = p['mesh'];
    b.position.set(x, y, z);
    m.position.set(x, y, z);
}

function deletePlayer(id) {
    var p = playerEntity[id];
    var b = p['body'];
    var m = p['mesh'];
    world.remove(b);
    scene.remove(m);
}