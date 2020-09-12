import React, { Component } from "react";
import { hot } from "react-hot-loader";
import * as THREE from "three/build/three.module.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import Editor from "./Editor";

// import "./App.css";
class Viewer extends Component {
  constructor(props) {
    super(props);

    this.state = {};

    this.envMaps = [];

    this.childMaterial = [];

    this.selectionName = [];

    this.selectionIndex = 0;

    this.isInputPopulated = false;
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
      this.showDownloadBtn();
      gltf.scene.name = "SCENE_MODEL";
      const selectorMenu = document.getElementById(
        "material-name-selector-dropdown"
      );
      const inputArea = document.getElementById("input-buttons-container");

      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          this.childMaterial.push(child.material);
          this.selectionName.push(child.material.name);
          child.material.envMap = this.hdrBackground;
          child.material.envMapIntensity = 1.0;

          // child.material.side = THREE.DoubleSide;
          this.populateDropDown(selectorMenu, child.material);
        }
      });

      selectorMenu.onchange = () => {
        console.log(selectorMenu.value);

        // alert(selectorMenu.selectedIndex);
        this.isInputPopulated = false;
        document.getElementById("input-buttons-container").innerHTML = "";
        const selectedOption = selectorMenu.value;
        const getSelectedOptionIndex = selectorMenu.selectedIndex;
        this.selectionIndex = getSelectedOptionIndex;
        this.populateInputs(this.selectionIndex);
      };

      inputArea.onclick = () => {
        const getInputEvent = event.target;
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            if (child.material.uuid == selectorMenu.value) {
              if (getInputEvent.type == "number") {
                const value = getInputEvent.id;
                // this.changeLabelText(value, getInputEvent.value);
                console.log(
                  "Initial " + value + " " + child.material[`${value}`]
                );
                child.material[`${value}`] = getInputEvent.value;
                console.log(
                  "After " + value + " " + child.material[`${value}`]
                );
              }
              if (getInputEvent.type == "checkbox") {
                const value = getInputEvent.id;
                // this.changeLabelText(value, getInputEvent.checked);
                child.material[`${value}`] = getInputEvent.checked;
                console.log("Value Changed", child.material[`${value}`]);
              }
              if (getInputEvent.type == "range") {
                if (
                  getInputEvent.parentNode.parentNode.nextSibling.innerText ==
                  "Color"
                ) {
                  //Avoid changing "Color",cause failing of color chaging
                  console.log("Color range");
                  if (getInputEvent.id == "r") {
                    child.material.color.r = getInputEvent.value;
                    this.changeRGBLabel(
                      getInputEvent.nextSibling,
                      getInputEvent.value
                    );
                  } else if (getInputEvent.id == "g") {
                    child.material.color.g = getInputEvent.value;
                    this.changeRGBLabel(
                      getInputEvent.nextSibling,
                      getInputEvent.value
                    );
                  } else {
                    child.material.color.b = getInputEvent.value;
                    this.changeRGBLabel(
                      getInputEvent.nextSibling,
                      getInputEvent.value
                    );
                  }
                } else if (
                  getInputEvent.parentNode.parentNode.nextSibling.innerText ==
                  "Emissive" //Avoid changing "Emissive",cause failing of color chaging
                ) {
                  console.log("emissive range");
                  if (getInputEvent.id == "r") {
                    child.material.emissive.r = getInputEvent.value;
                    this.changeRGBLabel(
                      getInputEvent.nextSibling,
                      getInputEvent.value
                    );
                  } else if (getInputEvent.id == "g") {
                    child.material.emissive.g = getInputEvent.value;
                    this.changeRGBLabel(
                      getInputEvent.nextSibling,
                      getInputEvent.value
                    );
                  } else {
                    child.material.emissive.b = getInputEvent.value;
                    this.changeRGBLabel(
                      getInputEvent.nextSibling,
                      getInputEvent.value
                    );
                  }
                }
                // console.log(child.material.color);
                // console.log(child.material.emissive);
              }
            }
          }
        });
        this.scene.add(gltf.scene);
      };
      this.scene.add(gltf.scene);
      document.getElementById("export-btn").onclick = () => {
        this.exportGltf(gltf.scene);
      };
    });
  };
  // handleChange =(e)=>{
  //   console.log('cliked');
  // }
  populateDropDown = (element, data) => {
    const option = document.createElement("option");
    option.value = data.uuid;
    option.innerText = data.name;
    element.appendChild(option);
    // console.log(this.selectorElement);
    this.populateInputs(this.selectionIndex);
  };

  populateInputs = (selectedIndex) => {
    // console.log(this.childMaterial[selectedIndex]);

    const dataKeys = Object.entries(this.childMaterial[selectedIndex]);
    // console.log(dataKeys);

    if (!this.isInputPopulated) {
      dataKeys.forEach((element) => {
        console.log(element);

        const inputBoxContainer = document.getElementById(
          "input-buttons-container"
        );
        // Create Input Element Div
        const inputBox = document.createElement("div");
        inputBox.className = "input-box";

        //Creating Label for input
        const label = document.createElement("label");
        label.innerText = element[0];
        label.id = "label-main-" + element[0];

        // Creating RGB Color Box
        const colorDiv = document.createElement("div");
        colorDiv.className = "color-container";
        colorDiv.style.width = "100%";
        colorDiv.style.display = "flex";
        colorDiv.style.flexDirection = "column";
        colorDiv.style.justifyContent = "flex-end";

        // Creating changing value for input
        const dynLabel = document.createElement("label");

        // Creating input for change
        const dynInput = document.createElement("input");
        dynInput.className = "dynamic-input";

        if (typeof element[1] == "number") {
          dynInput.type = "number";
          // console.log(typeof element[1]);
        } else if (typeof element[1] == "object") {
          if (!element[1]) {
            inputBox.style.display = "none";
          } else {
            dynLabel.style.display = "none";
            inputBox.style.flexDirection = "row-reverse";
            inputBox.style.alignItems = "center";
            const objectBlock = Object.entries(element[1]);
            const objectBlockKeys = Object.keys(element[1]);
            if (objectBlock.length == 3) {
              console.log(element[1]);
              const colorBlock = Object.entries(objectBlock);
              colorBlock.forEach((colorElement) => {
                colorElement.forEach((colorElementinner) => {
                  if (typeof colorElementinner != "string") {
                    if (colorElementinner[0] == "r") {
                      console.log(colorElementinner[0], colorElementinner[1]);
                      const colorSlider_label = document.createElement("div");
                      colorSlider_label.className = "color-slider-label";
                      const redColorSlider = document.createElement("input");
                      const r = document.createElement("span");
                      r.innerText = "R";
                      const rValue = document.createElement("span");
                      rValue.innerText = colorElementinner[1];
                      rValue.id = colorElementinner[0] + "-value";
                      redColorSlider.type = "range";
                      redColorSlider.className = "dynamic-input";
                      if (colorElementinner[1] <= 1) {
                        redColorSlider.min = 0;
                        redColorSlider.max = 1;
                        redColorSlider.step = 0.0000000001;
                      } else {
                        redColorSlider.min = 0;
                        redColorSlider.max = 255;
                        redColorSlider.step = 1;
                      }
                      redColorSlider.value = colorElementinner[1];
                      redColorSlider.id = colorElementinner[0];
                      console.log(redColorSlider);
                      colorSlider_label.appendChild(r);
                      colorSlider_label.appendChild(redColorSlider);
                      colorSlider_label.appendChild(rValue);
                      colorDiv.appendChild(colorSlider_label);
                    } else if (colorElementinner[0] == "g") {
                      console.log(colorElementinner[0], colorElementinner[1]);
                      const colorSlider_label = document.createElement("div");
                      colorSlider_label.className = "color-slider-label";
                      const greenColorSlider = document.createElement("input");
                      const g = document.createElement("span");
                      g.innerText = "G";
                      const gValue = document.createElement("span");
                      gValue.innerText = colorElementinner[1];
                      gValue.id = colorElementinner[0] + "-value";
                      greenColorSlider.type = "range";
                      greenColorSlider.className = "dynamic-input";
                      if (colorElementinner[1] <= 1) {
                        greenColorSlider.min = 0;
                        greenColorSlider.max = 1;
                        greenColorSlider.step = 0.0000000001;
                      } else {
                        greenColorSlider.min = 0;
                        greenColorSlider.max = 255;
                        greenColorSlider.step = 1;
                      }
                      greenColorSlider.value = colorElementinner[1];
                      greenColorSlider.id = colorElementinner[0];
                      console.log(greenColorSlider);
                      colorSlider_label.appendChild(g);
                      colorSlider_label.appendChild(greenColorSlider);
                      colorSlider_label.appendChild(gValue);
                      colorDiv.appendChild(colorSlider_label);
                    } else {
                      console.log(colorElementinner[0], colorElementinner[1]);
                      const colorSlider_label = document.createElement("div");
                      colorSlider_label.className = "color-slider-label";
                      const blueColorSlider = document.createElement("input");
                      const b = document.createElement("span");
                      b.innerText = "B";
                      const bValue = document.createElement("span");
                      bValue.innerText = colorElementinner[1];
                      bValue.id = colorElementinner[0] + "-value";
                      blueColorSlider.type = "range";
                      blueColorSlider.className = "dynamic-input";
                      if (colorElementinner[1] <= 1) {
                        blueColorSlider.min = 0;
                        blueColorSlider.max = 1;
                        blueColorSlider.step = 0.00000001;
                      } else {
                        blueColorSlider.min = 0;
                        blueColorSlider.max = 255;
                        blueColorSlider.step = 1;
                      }
                      blueColorSlider.value = colorElementinner[1];
                      blueColorSlider.id = colorElementinner[0];
                      console.log(blueColorSlider);
                      colorSlider_label.appendChild(b);
                      colorSlider_label.appendChild(blueColorSlider);
                      colorSlider_label.appendChild(bValue);
                      colorDiv.appendChild(colorSlider_label);
                    }
                    inputBox.appendChild(colorDiv);
                  }
                });
              });
              // console.log(Object.values(colorBlock));
            } else if (objectBlock.length != 3) {
              inputBox.style.display = "none";
            }
            // console.log(Object.keys(element[1]));
          }
          dynInput.style.display = "none";
        } else if (typeof element[1] == "boolean") {
          dynInput.type = "checkbox";
          dynInput.checked = element[1] ? true : false;
        } else if (element[1] === null) {
          inputBox.style.display = "none";
        }
        dynInput.id = element[0];
        dynInput.value = element[1];
        dynLabel.innerText = element[1] + " (old)";
        dynLabel.id = element[0] + "-label";
        // Append all element in inputBox
        inputBox.appendChild(label);
        inputBox.appendChild(dynInput);
        inputBox.appendChild(dynLabel);
        inputBoxContainer.appendChild(inputBox);
        this.isInputPopulated = true;
      });
    }
    // changingInput.onchange = (e) => {

    //   console.log(e.target.value);
    // };
    try {
      document.getElementById("uuid").parentElement.remove();
      document.getElementById("roughness").max = 1;
      document.getElementById("roughness").min = 0;
      document.getElementById("roughness").step = 0.01;
      document.getElementById("reflectivity").step = 0.1;
    } catch (error) {}
  };

  changeRGBLabel = (inputName, value) => {
    inputName.innerText = value;
  };

  exportGltf = (scene) => {
    const exporter = new GLTFExporter();

    var options = {
      trs: true, // for animations
      binary: true, // GLB instead of GLTF
    };

    // Parse the input and generate the glTF output
    exporter.parse(
      scene,
      (gltf) => {
        this.downloadFile("GLBfile",".glb", gltf);
      },
      options
    );

    // Also export JSON with material parameters
    var jsonObj = [];

    scene.traverse((child) => {
      if (child.isMesh) {
        const materialElementEntry = Object.entries(child.material);
        const materialJSONObject = {};
        materialElementEntry.forEach(element => {
          materialJSONObject[element[0]] = element[1];
        });
        jsonObj.push(materialJSONObject)
        console.log('New Material');
      }
    });
    this.downloadFile('JSONfileGLB',".json", JSON.stringify(jsonObj, null, 2));
  };

  downloadFile = (name,extension,fileData) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    // https://medium.com/@riccardopolacci/download-file-in-javascript-from-bytea-6a0c5bb3bbdb
    const blob = new Blob([fileData]);
    let now = new Date();
    const timeStamp = now.getDate() + months[now.getMonth()] + now.getFullYear()+ "_" + now.getHours() +"_"+ now.getMinutes();
    const filename = name + timeStamp + extension;

    // TODO: optimize it to use exisitng element; Maybe no need, see below this is temporary element
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  showDownloadBtn = ()=>{
    const btnCont = document.getElementById('export-button-container');
    btnCont.style.height = 'auto';
    btnCont.style.margin = '10px 0';
    btnCont.style.padding = '5px';
  }

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
        <Editor />
      </>
    );
  }
}

export default hot(module)(Viewer);
