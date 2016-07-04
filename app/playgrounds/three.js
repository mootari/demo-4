'use strict';

import * as d3 from 'd3';
import * as THREE from 'three';
import RenderMachine from 'render-machine-3js';

export default (parentNode, data) => {
  
  const config = {
    scene: {
      width: 900,
      height: 900,
      quality: 2
    },
    renderer: {
      options: {
        alpha: true,
        antialias: true
      },
      fps: 30
    },
    camera: {
      distance: 55,
      boundsX: [-1, 1],
      boundsY: [1.9, -.1],
      depth: [-200, 250],
      position: [2, 1, 2],
      rotation: .01
    },
    grid: {
      size: 100,
      step: 4,
      color: 0xdddddd,
      colorAxis: 0x888888
    }
  };
  
  const root = d3.hierarchy(data.node, (d) => d.childNodes);
  Object.assign(root, {
    x: 0,
    y: 0,
    z: 0,
    index: 0,
    offset: 0
  });
  root.children.forEach((d, i) => {
    d.index = i;
  });
  
  const PI_HALF = Math.PI / 2;
  const PI_DOUBLE = Math.PI * 2;
  
  root.descendants().slice(1).forEach((d) => {
    const distance = d.parent.children.length > 1 ? 5 : 0;
    d.offset = PI_DOUBLE / d.parent.children.length * d.index;
    d.offset += d.depth % 2 * PI_HALF;
    d.offset += d.parent.offset;

    d.y = d.parent.y + 5;
    d.x = d.parent.x + Math.cos(d.offset) * distance;
    d.z = d.parent.z + Math.sin(d.offset) * distance;

    d.children && d.children.forEach((d, i) => {
      d.index = i;
    });
  });


  const scene = new THREE.Scene();

  // Camera
  const ratio = config.scene.width / config.scene.height;
  const camera = new THREE.OrthographicCamera(
    config.camera.distance * config.camera.boundsX[0] * ratio,
    config.camera.distance * config.camera.boundsX[1] * ratio,
    config.camera.distance * config.camera.boundsY[0],
    config.camera.distance * config.camera.boundsY[1],
    config.camera.depth[0],
    config.camera.depth[1]
  );
  camera.position.set(
    config.camera.distance * config.camera.position[0],
    config.camera.distance * config.camera.position[1],
    config.camera.distance * config.camera.position[2]
  );
  camera.lookAt(scene.position);
  const cameraCenter = new THREE.Object3D();
  const rotateCamera = () => { cameraCenter.rotation.y += config.camera.rotation; };
  cameraCenter.add(camera);
  scene.add(cameraCenter);

  // Renderer
  const renderer = new THREE.WebGLRenderer(config.renderer.options);
  renderer.setSize(config.scene.width, config.scene.height);
  renderer.setSize(config.scene.width * config.scene.quality, config.scene.height * config.scene.quality, false);
  parentNode.appendChild(renderer.domElement);

  // Grid
  scene.add(new THREE.GridHelper(
    config.grid.size,
    config.grid.step,
    config.grid.colorAxis,
    config.grid.color
  ));


  const lineMat = new THREE.LineBasicMaterial({color: 0x000000, linewidth: 1});
  root.links().forEach((d) => {
    const geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(d.source.x, d.source.y, d.source.z));
    geometry.vertices.push(new THREE.Vector3(d.target.x, d.target.y, d.target.z));
    const line = new THREE.Line(geometry, lineMat);
    scene.add(line);
  });

  const cubeSize = .2;
  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const material = new THREE.MeshBasicMaterial({color: 0x000000});
  root.descendants().forEach((d) => {
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(d.x, d.y, d.z);
    scene.add( cube );
    // const egh = new THREE.EdgesHelper( cube, 0x000000 );
    // egh.material.linewidth = 2;
    // scene.add( egh );
  });

  // Loop
  const rm = new RenderMachine({camera: camera, renderer: renderer, scene: scene, fps: config.renderer.fps});
  rm.on('render', rotateCamera);
  rm.render();
  
}
