import * as THREE from "https://unpkg.com/three@0.126.1/build/three.module.js"
import {WEBGL} from "https://unpkg.com/three@0.126.1/examples/jsm/WebGL.js"
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/TrackballControls.js';
import Stats from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/stats.module'
import { NRRDLoader } from 'https://unpkg.com/three@0.126.1/examples/jsm/loaders/NRRDLoader.js';
import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';
// import { VolumeRenderShader1 } from 'https://unpkg.com/three@0.126.1/examples/jsm/shaders/VolumeShader.js'

import {VolumeRenderShader1} from './shader.js'


if ( WEBGL.isWebGL2Available() === false ) {document.body.appendChild( WEBGL.getWebGL2ErrorMessage());}

/* global var declaration */

var scene, renderer, camera, controls, stats;

const cmtextures = {
    viridis: new THREE.TextureLoader().load('./textures/cm_viridis.png', render),
    gray: new THREE.TextureLoader().load('./textures/cm_gray.png', render),
    autumn: new THREE.TextureLoader().load('./textures/cm_autumn.png', render),
    cool: new THREE.TextureLoader().load('./textures/cm_cool.png', render)
};

const shader = VolumeRenderShader1;
const material_arr = [];
const gui = new GUI();
const volconfig = { clim1: 0, clim2: 1, renderstyle: 'iso', isothreshold: 15500, colormap: 'viridis'};


function init()
{
    //create the scene
    scene = new THREE.Scene();

    //create the renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.setClearColor(0x0, 0);
    renderer.setPixelRatio(window.devicePixelRatio*2.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //create stats
    stats = Stats();
    document.body.appendChild(stats.dom);

    //create camera
    camera = new THREE.PerspectiveCamera(5, window.innerWidth/window.innerHeight, 500, 50000);
    camera.position.set(5000, 5000, -800);
    camera.up.set(0,1,0);

    //create controls
    controls = new OrbitControls(camera, renderer.domElement);
    // controls = new TrackballControls(camera, renderer.domElement);

    controls.addEventListener('change', render);
    // controls.target.set(0,0,128);
    controls.rotateSpeed = 2.0;
    controls.minZoom = 1000;
    controls.maxZoom = 40000;

    //create axeshelper
    scene.add(new THREE.AxesHelper(128));

    //set background
    // scene.background = new THREE.Color('grey');

    //set light
    // var light = new THREE.AmbientLight(0xFFFFFF, 1);
    // scene.add(light);


    // create GUI
    gui.add(volconfig, 'clim1', 0, 600, 200.00).onChange(updateUniforms);
    gui.add(volconfig, 'clim2', 0, 600, 200.00).onChange(updateUniforms);
    gui.add(volconfig, 'colormap', {gray: 'gray', viridis: 'viridis', autumn: 'autumn', cool: 'cool' }).onChange(updateUniforms);
    gui.add(volconfig, 'renderstyle', {iso: 'iso', mip:'mip' }).onChange(updateUniforms);
    gui.add(volconfig, 'isothreshold', 0, 65536, 500).onChange(updateUniforms);


    // //create a basicbox
    // var box_geometry = new THREE.BoxGeometry(10,10,10);
    // var box_material = new THREE.MeshPhongMaterial({color: 0x44aa88});

    // var cube = new THREE.Mesh(box_geometry, box_material);

    // scene.add(cube);

    render();

}

function updateUniforms()
{
    // update uniforms for all materials in material_arr
    for(const i in material_arr)
    {
        material_arr[i].uniforms['u_clim'].value.set(volconfig.clim1, volconfig.clim2);
        material_arr[i].uniforms['u_renderstyle'].value = volconfig.renderstyle == 'mip'? 0:1;
        material_arr[i].uniforms['u_renderthreshold'].value = volconfig.isothreshold;
        material_arr[i].uniforms['u_cmdata'].value = cmtextures[volconfig.colormap];
    }
    console.log(renderer.info.render);
    render();
}

function animate()
{
    requestAnimationFrame(animate);
    controls.update();
    render();
    stats.update();
}

function load_nrrd(url, idx)
{
    new NRRDLoader().load(url, (volume) => {

        console.log(volume);
        //TODO - Expt with IntType volume dtype for performance gains
        const texture = new THREE.DataTexture3D(volume.data, volume.xLength, volume.yLength, volume.zLength);
        texture.format = THREE.RedFormat;
        texture.type = THREE.FloatType;
        texture.minFilter = texture.magFilter = THREE.LinearFilter;
        texture.unpackAlignment = 1;

        // Colormap textures
        const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
        uniforms['u_data'].value = texture;
        uniforms['u_size'].value.set(volume.xLength, volume.yLength, volume.zLength);
        uniforms['u_clim'].value.set(volconfig.clim1, volconfig.clim2);
        uniforms['u_renderstyle'].value = volconfig.renderstyle == 'mip'? 0:1;
        uniforms['u_renderthreshold'].value = volconfig.isothreshold;
        uniforms['u_cmdata'].value = cmtextures[volconfig.colormap];
        
        // Set Material
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            side: THREE.BackSide // Volume Shader uses backside as its reference point
        });
        material_arr.push(material);

        // Create Mesh
        const geometry = new THREE.BoxBufferGeometry(volume.xLength, volume.yLength, volume.zLength);
        geometry.translate(volume.xLength/2, volume.yLength/2, volume.zLength/2);
		geometry.computeFaceNormals();

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(9*idx, -volume.yLength/2,-128 - volume.zLength/4);

        scene.add(mesh);
        render();
        
    });
}

// TODO - onWindowResize function

function start_load_data()
{
    for(var i=0; i<30; i++)
    {
        var filename = 'cscans_ami_' + parseInt(i) +'.nii.gz.nrrd';
        setTimeout(load_nrrd('http://localhost:9000/plot_data/' + filename, i), 0);
    }
}


init();
// animate();
start_load_data();




function render()
{
    renderer.render(scene, camera);
}
