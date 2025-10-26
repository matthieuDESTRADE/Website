//import * as THREE from "three";
//import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "https://unpkg.com/three@0.164.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.164.0/examples/jsm/loaders/GLTFLoader.js";


// Animation variables for smooth rotation
let targetRotationX = 0.6; // Initial rotation
let targetRotationY = 0;   // Will be controlled by scroll
let currentRotationX = 0.6;
let currentRotationY = 0;
let rotationSpeed = 0.01;
let shouldRotate = true;
let initialRotationY = 0;


let targetZ = 8;
let finalZ = 4.6;   // Final camera position (closer to Earth)
let finalRotationY = 1.6; // Full rotation (180 degrees)


// Scroll detection for projects and Earth zoom
function handleScroll() {
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
        
    // Calculate scroll progress (0 to 1)
    const scrollProgress = Math.min((1+scrollY) / maxScroll, 1);

    // Fade the intro title as the user scrolls down (linear)
    const introTitle = document.querySelector('#intro');
    if (introTitle) {
      // fade over the first 60% of the viewport height
      const fadeProgress = Math.min(scrollY / (window.innerHeight * 0.3), 1);
      introTitle.style.opacity = String(Math.max(1 - fadeProgress, 0));
    }
    
    // Smooth rotation change - from initial rotation to zero
    const initialRotationX = 0.6;
    const finalRotationX = 0.82;

  const slidePanel = document.getElementById("slide-panel");

  if (scrollProgress>0.1 & shouldRotate==true){
    shouldRotate = false;

    const dist_fr = (2*Math.PI)-(2+currentRotationY+0.1)%(2*Math.PI);
    const dist_ny = (2*Math.PI)-(2+currentRotationY-1.6)%(2*Math.PI);
    const dist_jp = (2*Math.PI)-(2+currentRotationY+1.6)%(2*Math.PI);

    if (dist_fr<=dist_ny & dist_fr<=dist_jp) {
      finalRotationY = -0.1;
    }
    else if (dist_ny<=dist_fr & dist_ny<=dist_jp) {
      finalRotationY = 1.6;
    }
    else{
      finalRotationY = -1.6;
    }


    while (finalRotationY < initialRotationY+2) {
    finalRotationY += 2*Math.PI;
    }
  } 
  const start_zoom = 0.1;
  if (scrollProgress<=start_zoom) {
    shouldRotate = true;
  }
  const local_scrollprogress = (scrollProgress-start_zoom)/(1.0-start_zoom)

  targetRotationY = initialRotationY + (local_scrollprogress * (finalRotationY - initialRotationY));

  const initialZ = 8; // Starting camera position
  targetZ = initialZ + (Math.min(local_scrollprogress*1.3,1) * (finalZ - initialZ));
  
  targetRotationX = initialRotationX + (Math.min(scrollProgress*1.3,1) * (finalRotationX - initialRotationX));


    
}

// Add scroll event listener
window.addEventListener("scroll", handleScroll);

// Run once to set initial states (title opacity, panel position, etc.)
handleScroll();

// === Three.js Background ===
const canvas = document.getElementById("bg3d");
const scene = new THREE.Scene();
let base_fov;
const camera = new THREE.PerspectiveCamera(125, window.innerWidth/window.innerHeight, 0.01, 1000);
camera.position.z = 8;

const phone_fov = 75
const pc_fov = 110
base_fov = phone_fov + (pc_fov-phone_fov) * Math.min((camera.aspect - 0.6), 1.2); 

camera.fov = 2*Math.atan(Math.tan(THREE.MathUtils.degToRad(base_fov/2))/camera.aspect)*180/Math.PI;
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(200/window.innerHeight); // lower resolution → pixellated effect

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  base_fov = phone_fov + (pc_fov-phone_fov) * Math.min((camera.aspect - 0.6), 1.2); 
  camera.fov = 2*Math.atan(Math.tan(THREE.MathUtils.degToRad(base_fov/2))/camera.aspect)*180/Math.PI;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(200/window.innerHeight); // lower resolution → pixellated effect
});

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 3);
sunLight.position.set(-10, 5, 7);
sunLight.castShadow = false;
scene.add(sunLight);

// Animated cubes
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x4f46e5, flatShading:true });
const cubes = [];
let model = null; // store reference
/*
for(let i=0;i<50;i++){
  const cube = new THREE.Mesh(geometry, material.clone());
  cube.position.set((Math.random()-0.5)*20,(Math.random()-0.5)*10,(Math.random()-0.5)*10);
  cube.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
  cube.material.color.setHSL(Math.random(),0.6,0.5);
  scene.add(cube);
  cubes.push(cube);
}
*/

// Load GLTF model
const loader = new GLTFLoader();
loader.load(
    "assets/earth/scene.gltf", // ⚠️ Make sure this path exists
    function(gltf){
        model = gltf.scene;
        model.scale.set(0.5,0.5,.5); // Increased size of the model
        model.position.set(0,0,0);
        model.rotation.set(0.7,0,0);

        model.traverse((child)=>{
            if(child.isMesh){
                child.material.flatShading = true;
                if(child.material.map){
                    child.material.map.magFilter = THREE.NearestFilter;
                    child.material.map.minFilter = THREE.NearestFilter;
                }
                if (child.material) {
                child.material.metalness = 0;   // no metallic shine
                child.material.roughness = 1;   // fully rough = diffuse look
                }
            }
        });

    scene.add(model);
  },
  undefined,
  function(error){ console.error("Model load error:", error); }
);


// Animation loop
function animate(){
  requestAnimationFrame(animate);
  
  // Smooth interpolation for rotation
  const lerpSpeed = 0.1; // Adjust this value to control smoothness (0.01 = very smooth, 0.1 = faster)
  const slidePanel = document.getElementById("slide-panel");

    // Zoom effect on Earth - move camera closer as we scroll
  camera.position.z += (targetZ - camera.position.z) * lerpSpeed;
  

  if (shouldRotate) {
    currentRotationY += rotationSpeed; 
    initialRotationY = currentRotationY;
    currentRotationX += (targetRotationX - currentRotationX) * lerpSpeed;
}
  else {
  currentRotationX += (targetRotationX - currentRotationX) * lerpSpeed;
  currentRotationY += (targetRotationY - currentRotationY) * lerpSpeed;


  // make movement linear with scroll: map progress 0..1 to right offset
  let rightValue = -10*window.innerWidth;
  const targetRot = finalRotationY-0.16;
  //Math.sin(initialRotationY + (local_scrollprogress * (finalRotationY - initialRotationY))-targetRot)/((initialZ + (Math.min(local_scrollprogress*1.2,1) * (finalZ - initialZ))-4.37))
  if (camera.position.z<5.0 & (Math.abs((currentRotationY-targetRot)%(2*Math.PI))<0.5)) {
    rightValue = Math.round(-(Math.max(window.innerHeight*2.5, window.innerWidth) - window.innerWidth)/2 + Math.min(1.3*window.innerHeight*Math.sin(currentRotationY-targetRot)/((camera.position.z-4.37)*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))) - window.innerWidth/2,0));
  }
  slidePanel.style.left = rightValue + 'px';
  slidePanel.setAttribute('aria-hidden','false');

}
  
  // Rotate loaded model if present
  if (model) {
    // Apply the smoothly interpolated rotation
    model.rotation.x = currentRotationX; // Keep X rotation fixed
    model.rotation.y = currentRotationY; // Smooth Y rotation + slow spinning
  }
  
  renderer.render(scene, camera);
}
animate();
