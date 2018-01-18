var createRigidBox = function (x, y, z, w, h, l, m) {
    var boxShape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, l / 2));
    var boxBody = new CANNON.Body({ mass: 0 });
    boxBody.addShape(boxShape);
    var boxGeometry = new THREE.BoxGeometry(w, h, l);
    var boxMesh = new THREE.Mesh(boxGeometry, m);
    world.add(boxBody);
    scene.add(boxMesh);
    boxBody.position.set(x, y, z);
    boxMesh.position.set(x, y, z);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    //boxes.push(wallBody);
    //boxMeshes.push(wallMesh);
    return { 'mesh': boxMesh, 'body': boxBody };
};

var createBox = function (x, y, z, w, h, l, m) {
    var boxShape = new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, l / 2));
    var boxBody = new CANNON.Body({ mass: 1 });
    boxBody.addShape(boxShape);
    var boxGeometry = new THREE.BoxGeometry(w, h, l);
    var boxMesh = new THREE.Mesh(boxGeometry, m);
    world.add(boxBody);
    scene.add(boxMesh);
    boxBody.position.set(x, y, z);
    boxMesh.position.set(x, y, z);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    boxes.push(boxBody);
    boxMeshes.push(boxMesh);
    return { 'mesh': boxMesh, 'body': boxBody };
};