import {OrbitControls} from "./js/OrbitControls.js";
import {module as noise} from "./js/perlin.js"

var canvas = document.getElementById("canvas");


//Variables for blade mesh
var joints = 5;
var w_ = 0.12;
var h_ = 1;

//Patch side length
var width = 120;

//Number of blades
var instances = 5000;

//Camera rotate
var rotate = false;

//Initialise three.js
var scene = new THREE.Scene();

var renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setClearColor( 0x66deff, 1);

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

//Lights
var light_1 = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(light_1);

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

noise.seed(Math.random());

function getYPosition(x, z){
    var y = 2*noise.simplex2(x/50, z/50);
    y += 4*noise.simplex2(x/100, z/100);
    y += 0.2*noise.simplex2(x/10, z/10);
    return y;
};

//The ground
var ground_geometry = new THREE.PlaneGeometry(width, width, 32, 32);
ground_geometry.lookAt(new THREE.Vector3(0,1,0));
ground_geometry.verticesNeedUpdate = true;
var ground_material = new THREE.MeshPhongMaterial({color: 0x002300});
var ground = new THREE.Mesh(ground_geometry, ground_material);

for (var i = 0; i < ground.geometry.vertices.length; i++){
    var v = ground.geometry.vertices[i];
    v.y = getYPosition(v.x, v.z);
}
ground.geometry.computeVertexNormals();
scene.add(ground);

//Define base geometry that will be instanced. We use a plane for an individual blade of grass
var base_geometry = new THREE.PlaneBufferGeometry(w_, h_, 1, joints);
base_geometry.translate(0,h_/2,0);
var base_material = new THREE.MeshPhongMaterial({color: 0xff0000, side: THREE.DoubleSide});
var base_blade = new THREE.Mesh(base_geometry, base_material);

//From:
//https://github.com/mrdoob/three.js/blob/master/examples/webgl_buffergeometry_instancing_dynamic.html
var instanced_geometry = new THREE.InstancedBufferGeometry();

//************** Attributes **************
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
for (var i = 0; i < instances; i++){
    //Offset of the roots
    x = Math.random() * width - width/2;
    z = Math.random() * width - width/2;
    y = getYPosition(x, z);
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
    if(i < instances/3){
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
//These have been taken from "Realistic real-time grass rendering" by Eddie Lee, 2010
var loader = new THREE.TextureLoader();
loader.crossOrigin = '';
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

var mesh = new THREE.Mesh( instanced_geometry, material );
scene.add(mesh);

//Show base geometry
// scene.add(base_blade);

//************** Draw **************
var time = 0;
function draw(){
    time += 1/100;
    material.uniforms.time.value = time;
    renderer.render(scene, camera);
    if(rotate){
        controls.update();
    }
    requestAnimationFrame(draw);
}

draw();