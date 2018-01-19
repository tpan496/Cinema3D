function createPointLight(x, y, z, color, intensity, distance, decay) {
    light = new THREE.PointLight(0xffffff, 1, 100, 2);
    light.position.set(x, y, z);

    light.castShadow = true;

    light.shadowCameraNear = 20;
    light.shadowCameraFar = 50;//camera.far;
    light.shadowCameraFov = 40;

    light.shadowMapBias = 0.1;
    light.shadowMapDarkness = 0.7;
    light.shadowMapWidth = 2 * 512;
    light.shadowMapHeight = 2 * 512;

    scene.add(light);
    return light;
}

function createAmbientLight(color){
    var ambient = new THREE.AmbientLight(color);
    scene.add(ambient);
    return ambient;
}

function createSpotLight(){

}

function createAudio(){

}