"use strict";

/*jslint browser:true*/

// The following represents my own coding style.  Feel free to modify as you
// see fit
/*jslint indent: 2*/
/*jslint plusplus: true*/

/*global THREE*/
/*global ThreeBSP*/
/*global requestAnimationFrame*/

/*global animate*/
/*global riemItUp*/
/*global subtractSide*/

// Standard essential environment vars
var camera,
  scene,
  renderer,
  // Add some lights
  light,
  ambientLight,
  // Define the geometry vars
  riemannGeo,
  innerCube,
  // Define the materials
  riemannMaterial,
  // And finally, the BSP stuff
  filledBSP,
  innerBSP,
  hollowCube;

// Instantiate the scene
scene = new THREE.Scene();

// Declare the camera!
// IMPORTANT!  Make sure perspecitive is window.innerWidth / window.innerHeight!
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 400;

// Let there be light
light = new THREE.DirectionalLight(0xffffff);
light.position.set(0, 200, 225);
scene.add(light);

// Let there be ambient light
ambientLight = new THREE.AmbientLight(0x070707);
scene.add(ambientLight);

// Create the cube itself
riemannGeo = new THREE.BoxGeometry(200, 200, 200);
riemannMaterial = new THREE.MeshLambertMaterial({
  color: 0xdd00dd,
  emissive: 0xaa00aa
});
filledBSP = new ThreeBSP(riemannGeo);

// Now hollow it
innerCube = new THREE.BoxGeometry(180, 180, 180);
innerBSP = new ThreeBSP(innerCube);
hollowCube = filledBSP.subtract(innerBSP);

// This is where the magic happens.  Should've picked a better name perhaps.
// Anyway, this is the function that makes the circles and what not
riemItUp();

// Convert our cube back to a mesh and add it back to the scene
hollowCube = hollowCube.toMesh(riemannMaterial);
hollowCube.rotation.x = -(Math.PI * 0.25);
hollowCube.rotation.z = -(Math.PI * 0.25);
scene.add(hollowCube);

// Instantiate renderer, set to same size as the window, and append
// it to the dom
renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

// Begin
animate();

function animate() {
  requestAnimationFrame(animate);
  hollowCube.rotation.x = Date.now() * 0.00005;
  hollowCube.rotation.y = Date.now() * 0.0001;

  renderer.render(scene, camera);
}

function riemItUp() {
  // All this does is call subtractSide, but a total of 6 times, for each six
  // sides of the cube
  subtractSide("yAxis");
  subtractSide("xAxis");
  subtractSide("zAxis");
}

// This calculates the subtracts for each side of the cube using the Riemann
// Zeta function
function subtractSide(side) {

  // This holds the array of cylinders we've constructed during the processing
  var cylinderArray = [],

    // The 3 variables below are used for the cylinder geometry, it's mesh, and
    // it's BSP representation respectively
    cylinderGeo,
    cylinderMesh,
    cylinderBSP,

    // As the name implies, initialArea and initialRadius describe the
    // attributes of the first cylinder for each side
    initialArea,
    initialRadius,
    range,

    // Whereas these variables are used for subsequent cylinders
    area,
    radius,

    // posA and posB are used to define a cylinders position with respect to
    // whatever plane it happens to be perpendicular to.  tmpPos is used to
    // store a Vector2 object while making distance calculations
    posA,
    posB,
    tmpPos,

    // These variables are used to define the bounds within which the cylinder
    // can fit given it's radius
    maxA,
    minA,
    maxB,
    minB,

    // Finally, distance and the isTouching flag are used to ensure that
    // cylinders keep their distance
    distance,
    isTouching = true,

    // Also, here are some counter vars
    i = 0;

  for (i = 0; i < 24; i++) {
    // Generate cylinder geo with radius according to the Riemann function
    if (i === 0) {
      // Initial cylinder.  Ar = Area of Side / Riemann of (1.25) = 4.59511
      initialArea = 40000 / 10.5844;
      initialRadius = Math.sqrt(initialArea / Math.PI);
      range = 100 - initialRadius;
      posA = (Math.random * range) - range;
      posB = (Math.random * range) - range;
      cylinderArray.push({
        radius: initialRadius,
        posPlane: new THREE.Vector2(posA, posB)
      });
    } else {
      // Add a new cylinder with radius determined by Riemann
      area = initialArea * Math.pow(i, -1.10);
      radius = Math.sqrt(area / Math.PI);
      if (radius < 5) {
        radius = 5;
      }
      // Then, find a position for it where it won't collide with the other tubes
      while (isTouching) {
        isTouching = false;
        // Each time this array is called, assign a new random position to the
        // cylinder
        posA = (Math.random() * 200) - 100;
        posB = (Math.random() * 200) - 100;

        // First, make sure the circle stays within the bounds dictated by the
        // plane
        maxA = posA + radius;
        minA = posA - radius;
        maxB = posB + radius;
        minB = posB - radius;
        if (maxA > 100 || minA < -100) {
          isTouching = true;
        } else if (maxB > 100 || minB < -100) {
          isTouching = true;
        } else {
          // If the sides are good, then check the distance between the other
          // cylinders
          tmpPos = new THREE.Vector2(posA, posB);
          for (i = 0; i < cylinderArray.length; i++) {
            // Calculate distance between the two points
            distance = tmpPos.distanceTo(cylinderArray[i].posPlane);
            // Subtract the radius from distance, getting the true distance
            distance = (distance - radius) - cylinderArray[i].radius;
            // and if there's effectively no gap between the touch, then they're
            // touching, so redo the cube
            if (distance <= 0) {
              isTouching = true;
              break;
            } // end if
          } // end for
        }
      } // end while
      isTouching = true;
      // At this point we finally have a position where the cylinder isn't
      // touching any of the other cylinders, so we push it to the array
      cylinderArray.push({
        radius: radius,
        posPlane: tmpPos
      });
    } // end else
  } // end for
  // Finally, after creating so many cylinders, we're ready.  Go through the
  // array of cylinders and perform a subtract on the cube with them, one-by-one
  for (i = 0; i < cylinderArray.length; i++) {
    // September 6th 2014.  Cylinder meshes are no longer created above, but
    // here instead.  The idea is that moving around meshes if they're touching
    // is a computationally costly operation.  Just move the position of the
    // center of the cylinders instead, then generate the geometries and meshes
    // down here using the radius and position data
    cylinderGeo = new THREE.CylinderGeometry(
      cylinderArray[i].radius,
      cylinderArray[i].radius,
      200,
      12
    );

    cylinderMesh = new THREE.Mesh(cylinderGeo, riemannMaterial);

    if (side === "xAxis") {
      cylinderMesh.rotation.x = -(Math.PI * 0.50);
      cylinderMesh.position.x = cylinderArray[i].posPlane.x;
      cylinderMesh.position.y = cylinderArray[i].posPlane.y;
    } else if (side === "yAxis") {
      cylinderMesh.position.x = cylinderArray[i].posPlane.x;
      cylinderMesh.position.z = cylinderArray[i].posPlane.y;
    } else if (side === "zAxis") {
      cylinderMesh.rotation.z = -(Math.PI * 0.50);
      cylinderMesh.position.y = cylinderArray[i].posPlane.x;
      cylinderMesh.position.z = cylinderArray[i].posPlane.y;
    }

    // cylinderBSP = new ThreeBSP(cylinderArray[i].mesh);
    cylinderBSP = new ThreeBSP(cylinderMesh);
    hollowCube = hollowCube.subtract(cylinderBSP);
  }
} // end subtractSide
