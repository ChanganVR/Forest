import {OrbitControls} from "./js/OrbitControls.js";

var canvas = document.getElementById("canvas");


//Variables for blade mesh
var joints = 5;
var w_ = 0.12;
var h_ = 1;

//Patch side length
var width = 1000;

//Number of blades
var num_instances = 50000;
var num_tree = 150;

//Camera rotat
var rotate = true;

//Initialise three.js
var scene = new THREE.Scene();

var renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas, alpha: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.setClearColor( 0x66deff, 1);

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var distance = 400;

var FOV = 2 * Math.atan( window.innerHeight / ( 2 * distance ) ) * 90 / Math.PI;

//Camera
var camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 1, 20000);
camera.position.set(-50, 10, 50);
scene.add(camera);

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

// //Lights
var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

var hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
// hemiLight.color.setHSV( 0.6, 0.75, 0.5 );
// hemiLight.groundColor.setHSV( 0.095, 0.5, 0.5 );
hemiLight.position.set( 0, 500, 0 );
scene.add( hemiLight );

var dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
dirLight.position.set( -1, 0.75, 1 );
dirLight.position.multiplyScalar( 50);
dirLight.name = "dirlight";
// dirLight.shadowCameraVisible = true;

scene.add( dirLight );

dirLight.castShadow = true;
dirLight.shadow.MapWidth = dirLight.shadow.MapHeight = 1024*2;

var d = 300;

dirLight.shadow.CameraLeft = -d;
dirLight.shadow.CameraRight = d;
dirLight.shadow.CameraTop = d;
dirLight.shadow.CameraBottom = -d;

dirLight.shadow.CameraFar = 3500;
dirLight.shadow.Bias = -0.0001;
dirLight.shadow.Darkness = 0.35;

var cubeTextureLoader = new THREE.CubeTextureLoader();
cubeTextureLoader.setPath( './materials/' );
var cubeTexture = cubeTextureLoader.load( [
    'px.jpg', 'nx.jpg',
    'py.jpg', 'ny.jpg',
    'pz.jpg', 'nz.jpg',
] );
scene.background = cubeTexture;


//OrbitControls.js for camera manipulation
var controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = rotate;
controls.autoRotateSpeed = 0.5;

//http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
function multiplyQuaternions(q1, q2){
    x =  q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x;
    y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y;
    z =  q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z;
    w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w;
    return new THREE.Vector4(x, y, z, w);
}

//The ground
var ground_geometry = new THREE.PlaneGeometry(1000, 1000, 32, 32);
ground_geometry.lookAt(new THREE.Vector3(0,1,0));
ground_geometry.verticesNeedUpdate = true;
var loader = new THREE.TextureLoader();
loader.crossOrigin = '';
var texture = loader.load( "./materials/soil.jpg" );
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.x = 30;
texture.repeat.y = 30;
var ground_material = new THREE.MeshLambertMaterial({ map : texture });
var ground = new THREE.Mesh(ground_geometry, ground_material);
ground.receiveShadow = true;

for (var i = 0; i < ground.geometry.vertices.length; i++){
    var v = ground.geometry.vertices[i];
    v.y = 0;
}
ground.geometry.computeVertexNormals();
scene.add(ground);

//Define base geometry that will be instanced. We use a plane for an individual blade of grass
var base_geometry = new THREE.PlaneBufferGeometry(w_, h_, 1, joints);
base_geometry.translate(0,h_/2,0);
var base_material = new THREE.MeshPhongMaterial({color: 0xff0000, side: THREE.DoubleSide});
var base_blade = new THREE.Mesh(base_geometry, base_material);

var instanced_geometry = new THREE.InstancedBufferGeometry();
instanced_geometry.index = base_geometry.index;
instanced_geometry.attributes.position = base_geometry.attributes.position;
instanced_geometry.attributes.uv = base_geometry.attributes.uv;

// Each instance has its own data for position, rotation and scale
var offsets = [];
var orientations = [];
var stretches = [];
var halfRootAngleSin = [];
var halfRootAngleCos = [];

//Temp variables
var quaternion_0 = new THREE.Vector4();
var quaternion_1 = new THREE.Vector4();
var x, y, z, w;

//The min and max angle for the growth direction (in radians)
var min = -0.25;
var max =  0.25;

//For each instance of the grass blade
for (var i = 0; i < num_instances; i++){
    //Offset of the roots
    x = Math.random() * width - width/2;
    z = Math.random() * width - width/2;
    y = 0;
    offsets.push( x, y, z);

    //Define random growth directions
    //Rotate around Y
    var angle = Math.PI - Math.random() * (2 * Math.PI);
    halfRootAngleSin.push(Math.sin(0.5*angle));
    halfRootAngleCos.push(Math.cos(0.5*angle));

    var RotationAxis = new THREE.Vector3(0, 1, 0);
    var x = RotationAxis.x * Math.sin(angle / 2.0);
    var y = RotationAxis.y * Math.sin(angle / 2.0);
    var z = RotationAxis.z * Math.sin(angle / 2.0);
    var w = Math.cos(angle / 2.0);
    quaternion_0.set( x, y, z, w).normalize();

    //Rotate around X
    angle = Math.random() * (max - min) + min;
    RotationAxis = new THREE.Vector3(1, 0, 0);
    x = RotationAxis.x * Math.sin(angle / 2.0);
    y = RotationAxis.y * Math.sin(angle / 2.0);
    z = RotationAxis.z * Math.sin(angle / 2.0);
    w = Math.cos(angle / 2.0);
    quaternion_1.set( x, y, z, w).normalize();

    //Combine rotations to a single quaternion
    quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1);

    //Rotate around Z
    angle = Math.random() * (max - min) + min;
    RotationAxis = new THREE.Vector3(0, 0, 1);
    x = RotationAxis.x * Math.sin(angle / 2.0);
    y = RotationAxis.y * Math.sin(angle / 2.0);
    z = RotationAxis.z * Math.sin(angle / 2.0);
    w = Math.cos(angle / 2.0);
    quaternion_1.set( x, y, z, w).normalize();

    //Combine rotations to a single quaternion
    quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1);

    orientations.push(quaternion_0.x, quaternion_0.y, quaternion_0.z, quaternion_0.w);

    //Define variety in height
    if(i < num_instances/3){
        stretches.push(Math.random() * 1.8);
    }else{
        stretches.push(Math.random());
    }
}

var offsetAttribute = new THREE.InstancedBufferAttribute( new Float32Array( offsets ), 3);
var stretchAttribute = new THREE.InstancedBufferAttribute( new Float32Array( stretches ), 1);
var halfRootAngleSinAttribute = new THREE.InstancedBufferAttribute( new Float32Array( halfRootAngleSin ), 1);
var halfRootAngleCosAttribute = new THREE.InstancedBufferAttribute( new Float32Array( halfRootAngleCos ), 1);
var orientationAttribute = new THREE.InstancedBufferAttribute( new Float32Array( orientations ), 4);

instanced_geometry.addAttribute( 'offset', offsetAttribute);
instanced_geometry.addAttribute( 'orientation', orientationAttribute);
instanced_geometry.addAttribute( 'stretch', stretchAttribute);
instanced_geometry.addAttribute( 'halfRootAngleSin', halfRootAngleSinAttribute);
instanced_geometry.addAttribute( 'halfRootAngleCos', halfRootAngleCosAttribute);

//Get alpha map and blade texture
var texture =  loader.load( './materials/blade_diffuse.jpg' );
var alphaMap =  loader.load( './materials/blade_alpha.jpg' );

//Define the material, specifying attributes, uniforms, shaders etc.
var material = new THREE.RawShaderMaterial( {
    uniforms: {
        map: { value: texture},
        alphaMap: { value: alphaMap},
        time: {type: 'float', value: 0}
    },
    vertexShader: document.getElementById( 'vertex-shader' ).textContent,
    fragmentShader: document.getElementById( 'fragment-shader' ).textContent,
    side: THREE.DoubleSide
} );

var forest = new THREE.Mesh( instanced_geometry, material );
// mesh.castShadow = true;
// mesh.receiveShadow = true;
scene.add(forest);

// add shadows to grass blades
forest.customDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    alphaTest: 0.5
});
forest.customDepthMaterial.onBeforeCompile = shader => {
    // app specific instancing shader code
    shader.vertexShader =
        `#define DEPTH_PACKING 3201
            attribute vec3 offset;
            attribute vec4 orientation;

            vec3 applyQuaternionToVector( vec4 q, vec3 v ){
               return v + 2.0 * cross( q.xyz, cross( q.xyz, v ) + q.w * v );
            }
` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        `
            vec3 vPosition = applyQuaternionToVector( orientation, transformed );

            vec4 mvPosition = modelViewMatrix * vec4( vPosition, 1.0 );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( offset + vPosition, 1.0 );`
    );

    shader.fragmentShader =
        "#define DEPTH_PACKING 3201" + "\n" + shader.fragmentShader;
};

forest.castShadow = true;
forest.receiveShadow = true;

// for debug
// var sphereGeometry = new THREE.SphereBufferGeometry(  1, 32, 32);
// var sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xff0000 } );
// var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
// sphere.castShadow = true; //default is false
// sphere.receiveShadow = true; //default
// scene.add( sphere );
// sphere.position.set(0, 3, 0);

// add sun to the scene
var sunGeometry = new THREE.SphereBufferGeometry(  2, 32, 32);
var sunMaterial = new THREE.MeshStandardMaterial( { color: 0xFDB813 } );
var sun = new THREE.Mesh( sunGeometry, sunMaterial );
scene.add( sun );


function draw_tree(x, z) {
// add tree to the scene
    var geometry = new THREE.BoxGeometry(1, 1, 1);

    var leaveDarkMaterial = new THREE.MeshLambertMaterial({color: 0x91E56E});
    var leaveLightMaterial = new THREE.MeshLambertMaterial({color: 0xA2FF7A});
    var leaveDarkDarkMaterial = new THREE.MeshLambertMaterial({color: 0x71B356});
    var stemMaterial = new THREE.MeshLambertMaterial({color: 0x7D5A4F});

    var tree_ground_offset = 1;

    var stem = new THREE.Mesh(geometry, stemMaterial);
    stem.castShadow = true;
    stem.position.set(x, tree_ground_offset, z);
    stem.scale.set(0.3, 2, 0.3);

    var squareLeave01 = new THREE.Mesh(geometry, leaveDarkMaterial);
    squareLeave01.castShadow = true;
    squareLeave01.position.set(x + 0.5, 1.6 + tree_ground_offset, z+0.5);
    squareLeave01.scale.set(0.8, 0.8, 0.8);

    var squareLeave02 = new THREE.Mesh(geometry, leaveDarkMaterial);
    squareLeave02.castShadow = true;
    squareLeave02.position.set(x - 0.4, 1.3 + tree_ground_offset, z-0.4);
    squareLeave02.scale.set(0.7, 0.7, 0.7);

    var squareLeave03 = new THREE.Mesh(geometry, leaveDarkMaterial);
    squareLeave03.castShadow = true;
    squareLeave03.position.set(x + 0.4, 1.7 + tree_ground_offset, z-0.5);
    squareLeave03.scale.set(0.7, 0.7, 0.7);

    var leaveDark = new THREE.Mesh(geometry, leaveDarkMaterial);
    leaveDark.castShadow = true;
    leaveDark.position.set(x, 1.2 + tree_ground_offset, z);
    leaveDark.scale.set(1, 2, 1);

    var leaveLight = new THREE.Mesh(geometry, leaveLightMaterial);
    leaveLight.castShadow = true;
    leaveLight.position.set(x+0, 1.2 + tree_ground_offset, z);
    leaveLight.scale.set(1.1, 0.5, 1.1);

    var tree = new THREE.Group();
    tree.add(leaveDark);
    tree.add(leaveLight);
    tree.add(squareLeave01);
    tree.add(squareLeave02);
    tree.add(squareLeave03);
    tree.add(ground);
    tree.add(stem);
    tree.scale.set(3, 3, 3);

    scene.add(tree);
}

for (var i=0; i <num_tree;i++){
    draw_tree((Math.random()-0.5) * 300, (Math.random()-0.5) * 300);
}


// var loader = new THREE.OBJLoader();
//
// // load a resource
// loader.load(
//     // resource URL
//     'materials/tree.obj',
//     // called when resource is loaded
//     function ( object ) {
//
//         scene.add( object );
//
//     },
//     // called when loading is in progresses
//     function ( xhr ) {
//
//         console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
//
//     },
//     // called when loading has errors
//     function ( error ) {
//
//         console.log( 'An error happened' );
//
//     }
// );



//Show base geometry
// scene.add(base_blade);

//************** Draw **************
var time = 0;
function draw(){
    time += 1/100;
    material.uniforms.time.value = time;
    // instanced_geometry.maxInstancedCount = Math.round(time * 10) % num_instances;

    renderer.render(scene, camera);
    if(rotate){
        controls.update();
    }
    dirLight.position.x = 50 * Math.cos(time * 0.5);
    dirLight.position.y = 50 * Math.sin(time * 0.5);
    sun.position.set(500 * Math.cos(time * 0.5), 500 * Math.sin(time * 0.5), 500);
    requestAnimationFrame(draw);
}

draw();