import React, { Component } from "react";
import { hot } from "react-hot-loader";
import * as THREE from "three/build/three.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import Editor from "./Editor";

// import "./App.css";
class Viewer extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.envMaps = [];

    // this.animate = this.animate.bind(this);
    // this.handleWindowResize = this.handleWindowResize.bind(this);
    // this.loadHDRTexture = this.loadHDRTexture.bind(this);
    // this.load3DModel = this.load3DModel.bind(this);
    // this.zoomCameraToSelection = this.zoomCameraToSelection.bind(this);
    // this.handleDrop = this.handleDrop.bind(this);
    // this.dragOverHandler = this.handleDragOver.bind(this);

    window.THREE = THREE;
  }

  componentDidMount() {
    this.init3D();
    // this.setupLights();

    let HDRIMap = "spiaggia_di_mondello_1k.hdr";
    this.loadHDRTexture(HDRIMap).then((hdrTexture) => {
      this.hdrCubeRenderTarget = this.pmremGenerator.fromEquirectangular(
        hdrTexture
      );
      this.hdrBackground = this.hdrCubeRenderTarget.texture;

      this.scene.background = this.hdrBackground;
      this.add3DObjects();

      // this.load3DModel();
    });

    this.animate();

    window.addEventListener("resize", this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowResize);
    window.cancelAnimationFrame(this.requestID);
  }

  handleWindowResize = () => {
    const width = this.el.clientWidth;
    const height = this.el.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  };

  loadHDRTexture = (filename) => {
    return new Promise((resolve) => {
      new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath("assets/3d/textures/envMaps/")
        .load(filename, (texture) => {
          resolve(texture);
        });
    });
  };

  load3DModel = () => {
    let dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("static/js/libs/draco/gltf/");
    let loader = new GLTFLoader();

    loader.setDRACOLoader(dracoLoader);
    // loader.load("../assets/3d/Nautilus_8.glb", (gltf) => {
    loader.load("../assets/3d/Nautilus_00_converter.glb", (gltf) => {
      console.info("GLTF file load complete");

      gltf.scene.name = "SCENE_MODEL";

      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material.envMap = this.hdrBackground;
          child.material.envMapIntensity = 1.0;

          // child.material.side = THREE.DoubleSide;
        }
      });

      this.scene.add(gltf.scene);
    });
  };

  load3DModelDrop = (contents) => {
    
    let dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("static/js/libs/draco/gltf/");
    let loader = new GLTFLoader();

    loader.setDRACOLoader(dracoLoader);
    // loader.load("../assets/3d/Nautilus_8.glb", (gltf) => {
    loader.parse(contents, "", (gltf) => {
      console.info("GLTF file load complete");

      gltf.scene.name = "SCENE_MODEL";
      const selectorMenu = document.getElementById('material-name-selector-dropdown')
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material.envMap = this.hdrBackground;
          child.material.envMapIntensity = 1.0;
          // child.material.side = THREE.DoubleSide;
          this.populateDropDown(selectorMenu,child.material);
        }
      });
      this.scene.add(gltf.scene);
    });
  };
  // handleChange =(e)=>{
  //   console.log('cliked');
  // }
  populateDropDown = (element,data) => {
    const option = document.createElement('option');
    option.value = data.name;
    option.innerText = data.name;
    element.appendChild(option)
  };

  // zoomCameraToSelection(camera, controls, selection = "SCENE_MODEL", fitOffset = 1.2) {
  zoomCameraToSelection(selection = "SCENE_MODEL", fitOffset = 1.0) {
    const box = new THREE.Box3();

    //for( const object of selection ) box.expandByObject( object );
    let sel2 = this.scene.getObjectByName(selection);
    if (sel2) {
      box.expandByObject(sel2);

      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      const maxSize = Math.max(size.x, size.y, size.z);
      const fitHeightDistance =
        maxSize / (2 * Math.atan((Math.PI * this.camera.fov) / 360));
      const fitWidthDistance = fitHeightDistance / this.camera.aspect;
      const distance =
        fitOffset * Math.max(fitHeightDistance, fitWidthDistance);

      const direction = this.controls.target
        .clone()
        .sub(this.camera.position)
        .normalize()
        .multiplyScalar(distance);

      this.controls.maxDistance = distance * 10;
      this.controls.target.copy(center);

      this.camera.near = distance / 100;
      this.camera.far = distance * 100;
      this.camera.updateProjectionMatrix();

      this.camera.position.copy(this.controls.target).sub(direction);

      this.controls.update();
    } else {
      console.log("zoomCameraToSelection FAILED");
    }
  }

  init3D = () => {
    const width = this.el.clientWidth;
    const height = this.el.clientHeight;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    this.camera.position.z = 15;

    this.renderer = new THREE.WebGLRenderer({
      // domElement: this.el,
      antialias: true,
    });
    this.renderer.setSize(width, height);

    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.renderer.toneMappingExposure = 1.0;

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.pmremGenerator.compileEquirectangularShader();

    // this.renderer.domElement.addEventListener("drop", this.handleDrop);
    // this.renderer.domElement.addEventListener("dragover", this.handleDragOver);

    this.el.appendChild(this.renderer.domElement);
    console.log(this.el);
    console.log(this.el.children[0]);
    console.log(this.el.children[0].ondrop);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
  };

  setupLights = () => {
    var ambient = new THREE.AmbientLight(0xffffff, 1.0);
    var directional = new THREE.DirectionalLight(0xffffff, 1.0);

    directional.position.y = 7.0;
    directional.position.z = 4.0;

    this.scene.add(ambient);
    this.scene.add(directional);
  };

  add3DObjects = () => {
    const geometry = new THREE.BoxBufferGeometry(4, 4, 4);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 1,
      roughness: 0,
      envMap: this.hdrBackground,
      envMapIntensity: 1.0,
    });

    this.cube = new THREE.Mesh(geometry, material);
    // this.scene.add(this.cube);
  };

  animate = () => {
    // this.zoomCameraToSelection();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    this.requestID = window.requestAnimationFrame(this.animate);
  };

  handleDrop = (event) => {
    console.log(event);
    event.preventDefault();
    event.stopPropagation();

    for (var i = 0; i < event.dataTransfer.items.length; i++) {
      // If dropped items aren't files, reject them
      let item = event.dataTransfer.items[i];
      if (item.kind === "file") {
        // console.log(item)
        let file = item.getAsFile();
        console.log("File[" + i + "] : " + file.name);

        var filename = file.name;
        var reader = new FileReader();
        reader.addEventListener("progress", (event) => {
          var size =
            "(" +
            new Intl.NumberFormat().format(Math.floor(event.total / 1000)) +
            " KB)";
          var progress = Math.floor((event.loaded / event.total) * 100) + "%";

          console.log("Loading", filename, size, progress);
        });

        reader.addEventListener("load", (event) => {
          var contents = event.target.result;
          this.load3DModelDrop(contents);
        });

        reader.readAsArrayBuffer(file);
      }
    }
  };

  handleDragOver = (event) => {
    // console.log("Files in drop zone:", event);

    // Prevent default behavior to open file in browser window
    event.preventDefault();
    event.stopPropagation();
  };

  render() {
    return (
      <>
        <div
          className="three-canvas-wrapper"
          ref={(ref) => (this.el = ref)}
          onDrop={this.handleDrop}
          onDragOver={this.handleDragOver}
        ></div>
        <Editor/>
      </>
    );
  }
}

export default hot(module)(Viewer);
