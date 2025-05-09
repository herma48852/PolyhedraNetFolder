// Executing Folding Net Script Version 1.31 (Formatted Data Table, No Default Load)
console.log(
    "Executing Folding Net Script Version 1.31 (Formatted Data Table, No Default Load)",
);

// --- Imports ---
import * as THREE from "three";
import { OrbitControls } from './js/OrbitControls.js';

// --- Global Variables ---
let scene;
let camera;
let renderer;
let controls;
const pivots = {};
const allVertices = {}; // Stores calculated initial world vertices for net layout
let f1Mesh = null;
const normalHelpers = {}; // Stores references to ArrowHelper objects

// --- Configuration ---
const sideLength = 3;
let NUM_ANIMATION_STAGES = 0; // Initialized to 0, set when net is loaded
let currentAnimationDuration = 500; // Default speed

// --- Animation State ---
let isFolded = false;
let isAnimating = false;
let isPaused = false;
let animationStartTime = 0;
let pausedElapsedTime = 0;
let currentAnimationStage = 0;
let startQuaternions = {}; // Use let for reset
let targetQuaternions = {}; // Use let for reset
let pivotsInCurrentStage = [];

// --- DOM Elements ---
let foldButton;
let pauseButton;
let speedSlider;
let speedValueSpan;
let toggleNormalsCheckbox;
let netFileInput;
let infoDisplay;

// --- Data Tables ---

// Color Name Lookup
const COLOR_NAME_TO_HEX = {
    red: 0xff0000,
    yellow: 0xffff00,
    green: 0x00ff00,
    blue: 0x0000ff,
    cyan: 0x00ffff,
    magenta: 0xff00ff,
    pink: 0xffc0cb,
    purple: 0x800080,
    teal: 0x008080,
    orange: 0xffa500,
    lime: 0x00ff00,
    indigo: 0x4b0082,
    violet: 0xee82ee,
    gold: 0xffd700,
    silver: 0xc0c0c0,
    gray: 0x808080,
    grey: 0x808080,
    white: 0xffffff,
    black: 0x000000,
};

// *** UPDATED Polyhedron data table - Formatted ***
const POLYHEDRON_DATA = {
    // --- Platonic Solids ---
    "3.3.3": {
        name: "Tetrahedron",
        faceCounts: {
            3: 4,
        },
        foldAngles: {
            "3-3": Math.acos(-1 / 3),
        },
    },
    "4.4.4": {
        name: "Cube (Hexahedron)",
        faceCounts: {
            4: 6,
        },
        foldAngles: {
            "4-4": Math.PI / 2,
        },
    },
    "3.3.3.3": {
        name: "Octahedron",
        faceCounts: {
            3: 8,
        },
        foldAngles: {
            "3-3": Math.acos(1 / 3),
        },
    },
    "5.5.5": {
        name: "Dodecahedron",
        faceCounts: {
            5: 12,
        },
        foldAngles: {
            "5-5": Math.acos(Math.sqrt(5) / 5),
        },
    },
    "3.3.3.3.3": {
        name: "Icosahedron",
        faceCounts: {
            3: 20,
        },
        foldAngles: {
            "3-3": Math.acos(Math.sqrt(5) / 3),
        },
    },
    // --- Archimedean Solids ---
    "3.6.6": {
        name: "Truncated Tetrahedron",
        faceCounts: {
            3: 4,
            6: 4,
        },
        foldAngles: {
            "3-6": Math.acos(1 / 3),
            "6-3": Math.acos(1 / 3),
            "6-6": Math.acos(-1 / 3),
        },
    },
    "3.8.8": {
        name: "Truncated Cube",
        faceCounts: {
            3: 8,
            8: 6,
        },
        foldAngles: {
            "3-8": Math.acos(Math.sqrt(3) / 3),
            "8-3": Math.acos(Math.sqrt(3) / 3),
            "8-8": Math.PI / 2,
        },
    },
    "4.6.6": {
        name: "Truncated Octahedron",
        faceCounts: {
            4: 6,
            6: 8,
        },
        foldAngles: {
            "4-6": Math.acos(1 / Math.sqrt(3)),
            "6-4": Math.acos(1 / Math.sqrt(3)),
            "6-6": Math.acos(1 / 3),
        },
    },
    "3.10.10": {
        name: "Truncated Dodecahedron",
        faceCounts: {
            3: 20,
            10: 12,
        },
        foldAngles: {
            "3-10": 0.6524, // ~37.38
            "10-3": 0.6524, // ~37.38
            "10-10": Math.acos(Math.sqrt(5) / 5)
        },
    },
    "5.6.6": {
        name: "Truncated Icosahedron",
        faceCounts: {
            5: 12,
            6: 20,
        },
        foldAngles: {
            "5-6": Math.acos(Math.sqrt((5 + 2 * Math.sqrt(5)) / 15)),
            "6-5": Math.acos(Math.sqrt((5 + 2 * Math.sqrt(5)) / 15)),
            "6-6": Math.acos(Math.sqrt(5) / 3)
        },
    },
    "3.4.3.4": {
        name: "Cuboctahedron",
        faceCounts: {
            3: 8,
            4: 6,
        },
        foldAngles: {
            "3-4": Math.acos(1 / Math.sqrt(3)),
            "4-3": Math.acos(1 / Math.sqrt(3)),
        },
    },
    "4.6.8": {
        name: "Truncated Cuboctahedron",
        faceCounts: {
            4: 12,
            6: 8,
            8: 6,
        },
        foldAngles: {
            "6-4": 0.6155, // ~35.26
            "4-6": 0.6155, // ~35.26
            "8-4": 0.7854, // 45
            "4-8": 0.7854, // 45
            "8-6": Math.acos(Math.sqrt(3) / 3),
            "6-8": Math.acos(Math.sqrt(3) / 3),
        },
    },
    "3.5.3.5": {
        name: "Icosidodecahedron",
        faceCounts: {
            3: 20,
            5: 12,
        },
        foldAngles: {
            "3-5": 0.6524, // ~37.37
            "5-3": 0.6524, // ~37.37
        },
    },
    "3.4.4.4": {
        name: "Rhombicuboctahedron",
        faceCounts: {
            3: 8,
            4: 18,
        },
        foldAngles: {
            "3-4": Math.acos(Math.sqrt(2 / 3)),
            "4-3": Math.acos(Math.sqrt(2 / 3)),
            "4-4": Math.PI / 4,
        },
    },
    "3.4.5.4": {
        name: "Rhombicosidodecahedron",
        faceCounts: {
            3: 20,
            4: 30,
            5: 12,
        },
        foldAngles: {
            "3-4": Math.acos(Math.sqrt((3 + Math.sqrt(5)) / 6)),
            "4-3": Math.acos(Math.sqrt((3 + Math.sqrt(5)) / 6)),
            "4-5": Math.acos(Math.sqrt((5 + Math.sqrt(5)) / 10)),
            "5-4": Math.acos(Math.sqrt((5 + Math.sqrt(5)) / 10)),
            "4-4": Math.acos((1 + Math.sqrt(5)) / (2 * Math.sqrt(3))),
        },
    },
    "4.6.10": {
        name: "Truncated Icosidodecahedron",
        faceCounts: {
            4: 30,
            6: 20,
            10: 12,
        },
        foldAngles: {
            "4-6":  Math.acos((Math.sqrt(3) + Math.sqrt(15)) / 6), 
            "6-4":  Math.acos((Math.sqrt(3) + Math.sqrt(15)) / 6), 
            "4-10": Math.acos(Math.sqrt((5 + Math.sqrt(5)）/ 10)),
            "10-4": Math.acos(Math.sqrt((5 + Math.sqrt(5)）/ 10)),
            "10-6": Math.acos(Math.sqrt((5 + (2 * Math.sqrt(5))）/ 15)),
            "6-10": Math.acos(Math.sqrt((5 + (2 * Math.sqrt(5))）/ 15)),
        },
    },
    "3.3.3.3.4": {
        name: "Snub Cube",
        faceCounts: {
            3: 32,
            4: 6,
        },
        foldAngles: {
            "3-3": 0.4672, // ~26.77 deg
            "3-4": 0.6462, // ~37.02 deg
            "4-3": 0.6462,
        },
    },
    "3.3.3.3.5": {
        name: "Snub Dodecahedron",
        faceCounts: {
            3: 80,
            5: 12,
        },
        foldAngles: {
            "3-3": 0.2762, // ~15.82 deg
            "3-5": 0.4725, // ~27.07 deg
            "5-3": 0.4725,
        },
    },
};

// Helper function to generate a canonical face count signature string
function getFaceCountSignature(counts) {
    return Object.keys(counts)
        .map((key) => parseInt(key))
        .sort((a, b) => a - b)
        .map((key) => `${key}:${counts[key.toString()]}`)
        .join("_");
}

// Reverse lookup table: Signature -> Vertex Config Key
const faceCountSigToVertexConfigKey = {};
for (const key in POLYHEDRON_DATA) {
    const data = POLYHEDRON_DATA[key];
    if (data.faceCounts) {
        const signature = getFaceCountSignature(data.faceCounts);
        faceCountSigToVertexConfigKey[signature] = key;
    }
}
// console.log("Face Count Signatures Map:", faceCountSigToVertexConfigKey);

// Global variable to store fold angles for the currently loaded net
let currentFoldAngles = null;
let currentNetName = "No Net Loaded";

// --- Helper Functions --- (Unchanged)

/**
 * Parses various color inputs (names, #hex, 0xhex, numbers)
 * into a numerical hex value for Three.js materials.
 * Includes a workaround for missing '#' prefixes on 6-digit hex strings.
 * @param {string | number} colorInput - The color input.
 * @returns {number} The numerical hex value (e.g., 0xFF0000).
 */
function parseColor(colorInput) {
    const defaultColorHex = 0xaaaaaa; // Default gray as a number
    console.log(
        `[DEBUG] parseColor received input: "${colorInput}" (type: ${typeof colorInput})`,
    );

    if (colorInput === null || colorInput === undefined) {
        console.warn(
            `Received null or undefined color input. Using default gray.`,
        );
        return defaultColorHex;
    }

    let processedColorInput = colorInput; // Work with a copy/potentially modified version

    // --- WORKAROUND: Add '#' prefix if missing from likely hex string ---
    if (
        typeof processedColorInput === "string" &&
        processedColorInput.length === 6 && // Is it 6 chars long?
        !processedColorInput.startsWith("#") && // Doesn't already start with #?
        !processedColorInput.startsWith("0x") && // Doesn't start with 0x?
        /^[0-9A-Fa-f]{6}$/i.test(processedColorInput)
    ) {
        // Contains only hex chars (case-insensitive)?
        console.log(
            `[DEBUG] Adding '#' prefix to suspected hex string: "${processedColorInput}"`,
        );
        processedColorInput = "#" + processedColorInput; // Add the prefix
    }
    // --- End Workaround ---

    try {
        // Use THREE.Color constructor with the original or potentially corrected input
        const color = new THREE.Color(processedColorInput);
        const hexValue = color.getHex();
        // Optional: Log success only if prefix was added or input was different
        // if (processedColorInput !== colorInput) {
        console.log(
            `[DEBUG] parseColor successfully parsed "<span class="math-inline">\{processedColorInput\}" to hex\: 0x</span>{hexValue.toString(16)}`,
        );
        // }
        return hexValue;
    } catch (error) {
        // Log error using the processed input for clarity
        console.warn(
            `Invalid color input "<span class="math-inline">\{processedColorInput\}" \(original\: "</span>{colorInput}"). Using default gray. Error: ${error.message}`,
        );
        return defaultColorHex;
    }
}

// Gets current world vertices
function getMeshWorldVertices(faceIndex) {
    let mesh;
    if (faceIndex === 1) mesh = f1Mesh;
    else if (pivots[faceIndex]?.children.length > 0)
        mesh = pivots[faceIndex].children[0];
    else return null;
    if (!mesh?.geometry?.attributes?.position) return null;
    const positions = mesh.geometry.attributes.position;
    const uniqueVerts = new Map();
    const tempVec = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
        tempVec.fromBufferAttribute(positions, i);
        const key = `${tempVec.x.toFixed(5)},${tempVec.y.toFixed(5)},${tempVec.z.toFixed(5)}`;
        if (!uniqueVerts.has(key)) uniqueVerts.set(key, tempVec.clone());
    }
    const uniqueLocalVertices = Array.from(uniqueVerts.values());
    mesh.updateWorldMatrix(true, false);
    const worldVertices = uniqueLocalVertices.map((v) =>
        v.clone().applyMatrix4(mesh.matrixWorld),
    );
    if (allVertices[faceIndex])
        worldVertices.numSides = allVertices[faceIndex].numSides;
    return worldVertices;
}

// Calculates world normal
function calculateWorldNormal(worldVerts) {
    if (!worldVerts || worldVerts.length < 3) return new THREE.Vector3(0, 1, 0);
    const [vA, vB, vC] = worldVerts;
    if (
        !(
            vA instanceof THREE.Vector3 &&
            vB instanceof THREE.Vector3 &&
            vC instanceof THREE.Vector3
        )
    )
        return new THREE.Vector3(0, 1, 0);
    const edge1 = new THREE.Vector3().subVectors(vB, vA);
    const edge2 = new THREE.Vector3().subVectors(vC, vA);
    return new THREE.Vector3().crossVectors(edge1, edge2).normalize();
}

// Calculates world centroid
function calculateWorldCentroid(worldVerts) {
    const center = new THREE.Vector3();
    let count = 0;
    if (!worldVerts) return center;
    for (let i = 0; i < worldVerts.length; ++i) {
        if (worldVerts[i] instanceof THREE.Vector3) {
            center.add(worldVerts[i]);
            count++;
        }
    }
    return count > 0 ? center.divideScalar(count) : center.set(0, 0, 0);
}

// Calculates local normal for helper
function calculateLocalNormal(localVerts) {
    if (!localVerts || localVerts.length < 3) return new THREE.Vector3(0, 1, 0);
    const [vA, vB, vC] = localVerts;
    if (
        !(
            vA instanceof THREE.Vector3 &&
            vB instanceof THREE.Vector3 &&
            vC instanceof THREE.Vector3
        )
    )
        return new THREE.Vector3(0, 1, 0);
    const edge1 = new THREE.Vector3().subVectors(vB, vA);
    const edge2 = new THREE.Vector3().subVectors(vC, vA);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    if (normal.y < -0.1) normal.negate();
    return normal;
}

// Calculates local center for helper
function calculateLocalCenter(localVerts) {
    const center = new THREE.Vector3();
    let count = 0;
    if (!localVerts) return center;
    localVerts.forEach((v) => {
        if (v instanceof THREE.Vector3) {
            center.add(v);
            count++;
        }
    });
    return count > 0 ? center.divideScalar(count) : center;
}

// Calculates hypothetical vertices
function calculateHypotheticalWorldVertices(faceIndex, angle) {
    const pivot = pivots[faceIndex];
    const mesh = pivot?.children[0];
    const parent = pivot?.parent;
    if (!pivot || !mesh || !mesh.geometry || !parent) return null;
    const positions = mesh.geometry.attributes.position;
    const uniqueVerts = new Map();
    const tempVec = new THREE.Vector3();
    for (let i = 0; i < positions.count; i++) {
        tempVec.fromBufferAttribute(positions, i);
        const key = `${tempVec.x.toFixed(5)},${tempVec.y.toFixed(5)},${tempVec.z.toFixed(5)}`;
        if (!uniqueVerts.has(key)) uniqueVerts.set(key, tempVec.clone());
    }
    const uniqueLocalVertices = Array.from(uniqueVerts.values());
    if (uniqueLocalVertices.length < 3) return null;
    const hypotheticalLocalQuat = new THREE.Quaternion().setFromAxisAngle(
        pivot.userData.axis,
        angle,
    );
    parent.updateWorldMatrix(true, true);
    const hypotheticalPivotWorldMatrix = parent.matrixWorld.clone();
    const pivotLocalTransform = new THREE.Matrix4().compose(
        pivot.position,
        hypotheticalLocalQuat,
        pivot.scale,
    );
    hypotheticalPivotWorldMatrix.multiply(pivotLocalTransform);
    const worldVertices = uniqueLocalVertices.map((v) =>
        v.clone().applyMatrix4(hypotheticalPivotWorldMatrix),
    );
    if (allVertices[faceIndex])
        worldVertices.numSides = allVertices[faceIndex].numSides;
    const validWorldVertices = worldVertices.filter(
        (v) => v instanceof THREE.Vector3,
    );
    return validWorldVertices.length >= 3 ? validWorldVertices : null;
}

// --- Initialization Function ---
function init() {
    // Basic scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.set(0, 20, 20);
    camera.lookAt(0, 0, 0);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("container").appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0, 0);
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Get DOM Elements
    foldButton = document.getElementById("foldButton");
    pauseButton = document.getElementById("pauseButton");
    speedSlider = document.getElementById("speedSlider");
    speedValueSpan = document.getElementById("speedValue");
    toggleNormalsCheckbox = document.getElementById("toggleNormals");
    netFileInput = document.getElementById("netFile");
    infoDisplay = document.getElementById("info");

    // Initial UI setup
    speedSlider.value = currentAnimationDuration;
    speedValueSpan.textContent = `${currentAnimationDuration} ms`;
    pauseButton.disabled = true;
    toggleNormalsCheckbox.checked = false;
    infoDisplay.textContent = "Load a Net JSON File"; // Initial title

    // --- NO Default Net Load ---

    // Add Event Listeners
    window.addEventListener("resize", onWindowResize);
    foldButton.addEventListener("click", toggleFold);
    pauseButton.addEventListener("click", togglePause);
    speedSlider.addEventListener("input", (event) => {
        currentAnimationDuration = parseInt(event.target.value, 10);
        speedValueSpan.textContent = `${currentAnimationDuration} ms`;
    });
    toggleNormalsCheckbox.addEventListener(
        "change",
        toggleNormalHelpersVisibility,
    );
    netFileInput.addEventListener("change", handleFileSelect);

    // Start animation loop
    animate();
}

// --- Function to Load Net Data from JSON ---
function loadAndProcessNet(netData) {
    // Accepts parsed data object
    console.log(`Processing net: ${netData.description || "Unnamed Net"}`);
    isFolded = false;
    isAnimating = false;
    isPaused = false;
    currentAnimationStage = 0;
    foldButton.textContent = "Fold";
    pauseButton.disabled = true;

    try {
        const faceCounts = {};
        if (!netData.baseFace?.noSides)
            throw new Error("Invalid net data: Missing/invalid baseFace");
        const baseSides = netData.baseFace.noSides.toString();
        faceCounts[baseSides] = 1;
        if (!netData.connections || !Array.isArray(netData.connections))
            throw new Error(
                "Invalid net data: Missing/invalid connections array",
            );
        netData.connections.forEach((conn, index) => {
            if (!conn.noSides)
                throw new Error(
                    `Invalid connection data at index ${index}: Missing noSides`,
                );
            const sides = conn.noSides.toString();
            faceCounts[sides] = (faceCounts[sides] || 0) + 1;
        });
        console.log("Detected Face Counts:", faceCounts);

        const signature = getFaceCountSignature(faceCounts);
        console.log("Generated Signature:", signature);
        const vertexConfigKey = faceCountSigToVertexConfigKey[signature];
        if (!vertexConfigKey)
            throw new Error(
                `Unknown polyhedron signature: ${signature}. Add data to POLYHEDRON_DATA.`,
            );
        console.log("Matched Vertex Configuration:", vertexConfigKey);

        const polyhedronInfo = POLYHEDRON_DATA[vertexConfigKey];
        if (!polyhedronInfo?.foldAngles)
            throw new Error(
                `Fold angle data not found for config: ${vertexConfigKey}`,
            );
        currentFoldAngles = polyhedronInfo.foldAngles;
        currentNetName =
            polyhedronInfo.name || netData.description || "Loaded Net";
        console.log("Using Fold Angles:", currentFoldAngles);

        NUM_ANIMATION_STAGES = netData.connections.length;
        console.log(`Set NUM_ANIMATION_STAGES to: ${NUM_ANIMATION_STAGES}`);

        createNetFromData(netData); // Create geometry

        if (infoDisplay) infoDisplay.textContent = `Folding: ${currentNetName}`;
    } catch (error) {
        console.error("Failed to process net data:", error);
        alert(`Error processing net data: ${error.message}. Check console.`);
        clearSceneGeometry();
        if (infoDisplay) infoDisplay.textContent = `Error Loading Net`;
        currentFoldAngles = null;
        NUM_ANIMATION_STAGES = 0;
    }
}

// --- Event handler for file input ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".json")) {
        alert("Please select a valid .json file.");
        event.target.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const netData = JSON.parse(e.target.result);
            console.log(`Processing loaded file: ${file.name}`);
            loadAndProcessNet(netData);
        } catch (error) {
            console.error("Error parsing JSON file:", error);
            alert(`Error parsing JSON file: ${error.message}`);
        } finally {
            event.target.value = "";
        }
    };
    reader.onerror = (e) => {
        console.error("Error reading file:", e);
        alert("Error reading file.");
        event.target.value = "";
    };
    reader.readAsText(file);
}

// --- Function to clear existing net geometry ---
function clearSceneGeometry() {
    console.log("Clearing existing net geometry...");
    Object.keys(pivots).forEach((key) => {
        const pivot = pivots[key];
        if (!pivot) return;
        while (pivot.children.length > 0) {
            const child = pivot.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            pivot.remove(child);
        }
        if (pivot.parent) pivot.parent.remove(pivot);
        delete pivots[key];
    });
    if (f1Mesh) {
        while (f1Mesh.children.length > 0) {
            const child = f1Mesh.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            f1Mesh.remove(child);
        }
        scene.remove(f1Mesh);
        f1Mesh.geometry.dispose();
        f1Mesh.material.dispose();
        f1Mesh = null;
    }
    Object.keys(allVertices).forEach((key) => delete allVertices[key]);
    Object.keys(normalHelpers).forEach((key) => delete normalHelpers[key]);
    // Reset animation state variables
    isFolded = false;
    isAnimating = false;
    isPaused = false;
    currentAnimationStage = 0;
    pivotsInCurrentStage = [];
    startQuaternions = {};
    targetQuaternions = {};
    if (foldButton) foldButton.textContent = "Fold";
    if (pauseButton) pauseButton.disabled = true;
    console.log("Clear complete.");
}

// --- Geometry & Base Vertex Functions ---
function calculateBaseRegularPolygonVertices(numSides, sideLength) {
    const vertices = [];
    if (numSides < 3) return vertices;
    const R = sideLength / (2 * Math.sin(Math.PI / numSides));
    const angleStep = (2 * Math.PI) / numSides;
    const startAngle = -Math.PI / 2 - Math.PI / numSides;
    for (let i = 0; i < numSides; i++) {
        const angle = startAngle + i * angleStep;
        const x = R * Math.cos(angle);
        const z = R * Math.sin(angle);
        vertices.push(
            new THREE.Vector3(
                Math.abs(x) < 1e-9 ? 0 : x,
                0,
                Math.abs(z) < 1e-9 ? 0 : z,
            ),
        );
    }
    return vertices;
}

function createRegularPolygonGeometry(vertices) {
    const geometry = new THREE.BufferGeometry();
    if (!vertices || vertices.length < 3) return geometry;
    const numSides = vertices.length;
    const positions = [];
    const v0 = vertices[0];
    for (let i = 1; i <= numSides - 2; i++) {
        positions.push(v0.x, v0.y, v0.z);
        positions.push(vertices[i + 1].x, vertices[i + 1].y, vertices[i + 1].z);
        positions.push(vertices[i].x, vertices[i].y, vertices[i].z);
    }
    geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.computeVertexNormals();
    return geometry;
}

// --- Net Creation function --- Accepts netData from JSON
function createNetFromData(netData) {
    console.log("Creating net geometry from loaded data...");
    const L = sideLength;
    clearSceneGeometry();

    try {
        const baseFaceSides = netData.baseFace.noSides;
        const baseFaceColorValue = parseColor(netData.baseFace.color);
        allVertices[1] = calculateBaseRegularPolygonVertices(baseFaceSides, L);
        allVertices[1].numSides = baseFaceSides;
        const baseGeom = createRegularPolygonGeometry(allVertices[1]);
        if (
            !baseGeom.attributes.position ||
            baseGeom.attributes.position.count === 0
        )
            throw new Error("Base geometry creation failed.");
        const baseMat = new THREE.MeshStandardMaterial({
            color: baseFaceColorValue,
            side: THREE.DoubleSide,
            roughness: 0.8,
        });
        f1Mesh = new THREE.Mesh(baseGeom, baseMat);
        scene.add(f1Mesh);

        const f1LocalCenter = calculateLocalCenter(allVertices[1]);
        const f1LocalNormal = calculateLocalNormal(allVertices[1]);
        const arrowHelper1 = new THREE.ArrowHelper(
            f1LocalNormal,
            f1LocalCenter,
            L / 2,
            0x000000,
            L / 4,
            L / 8,
        );
        f1Mesh.add(arrowHelper1);
        normalHelpers[1] = arrowHelper1;

        const connections = netData.connections;
        const tempVec1 = new THREE.Vector3();
        const tempVec2 = new THREE.Vector3();
        const Q = new THREE.Vector3();
        const tempMatrix = new THREE.Matrix4();
        const tempQuatInv = new THREE.Quaternion();
        const tempWorldPos = new THREE.Vector3();

        for (const conn of connections) {
            const i = conn.from;
            const j = conn.to;
            const k = conn.noSides;
            const colorInput = conn.color;
            // Corrected Check: Allow 'to' ID (j) to be 0, but check types and minimum sides
            if (
                typeof i !== "number" ||
                typeof j !== "number" ||
                j < 0 ||
                typeof k !== "number" ||
                k < 3
            ) {
                console.warn(
                    `Skipping invalid connection definition (missing or invalid type/value):`,
                    conn,
                );
                continue;
            }

            let parentVertices = j === 1 ? allVertices[1] : allVertices[j];
            if (!parentVertices?.numSides) {
                console.error(
                    `Net Gen Error: Parent F${j} vertices not found for F${i}`,
                );
                continue;
            }

            const Fi_base_vertices = calculateBaseRegularPolygonVertices(k, L);
            const Fi_M_vertex_index = conn.fromEdge[0];
            const Fi_N_vertex_index = conn.fromEdge[1];
            if (
                Fi_M_vertex_index === undefined ||
                Fi_M_vertex_index < 0 ||
                Fi_M_vertex_index >= k ||
                Fi_N_vertex_index === undefined ||
                Fi_N_vertex_index < 0 ||
                Fi_N_vertex_index >= k
            ) {
                console.warn(
                    `Skipping F${i}: Invalid fromEdge indices ${conn.fromEdge}`,
                );
                continue;
            }
            const W = tempVec1.subVectors(
                Fi_base_vertices[Fi_N_vertex_index],
                Fi_base_vertices[Fi_M_vertex_index],
            );

            const parentNumSides = parentVertices.numSides;
            const Fj_R_vertex_index = conn.toEdge[0];
            const Fj_S_vertex_index = conn.toEdge[1];
            if (
                Fj_R_vertex_index === undefined ||
                Fj_R_vertex_index < 0 ||
                Fj_R_vertex_index >= parentNumSides ||
                Fj_S_vertex_index === undefined ||
                Fj_S_vertex_index < 0 ||
                Fj_S_vertex_index >= parentNumSides
            ) {
                console.warn(
                    `Skipping F${i}: Invalid toEdge indices ${conn.toEdge} for parent F${j}`,
                );
                continue;
            }
            const Fj_R_vertex = parentVertices[Fj_R_vertex_index];
            const Fj_S_vertex = parentVertices[Fj_S_vertex_index];
            if (!Fj_R_vertex || !Fj_S_vertex) {
                console.error(
                    `Net Gen Error: Parent F${j} R/S vertices missing for F${i}`,
                );
                continue;
            }
            const V = tempVec2.subVectors(Fj_S_vertex, Fj_R_vertex);

            const dot = W.x * V.x + W.z * V.z;
            const det = W.x * V.z - W.z * V.x;
            let alpha = Math.atan2(det, dot);
            if (W.lengthSq() < 1e-9 || V.lengthSq() < 1e-9) alpha = 0;

            const cosA = Math.cos(alpha);
            const sinA = Math.sin(alpha);
            const Fi_rotated_vertices = Fi_base_vertices.map(
                (v) =>
                    new THREE.Vector3(
                        v.x * cosA - v.z * sinA,
                        0,
                        v.x * sinA + v.z * cosA,
                    ),
            );
            const Fi_M_rotated_vertex = Fi_rotated_vertices[Fi_M_vertex_index];
            Q.subVectors(Fj_R_vertex, Fi_M_rotated_vertex);
            const Fi_final_world_vertices = Fi_rotated_vertices.map((v) =>
                v.clone().add(Q),
            );

            allVertices[i] = Fi_final_world_vertices;
            allVertices[i].numSides = k;
            allVertices[i].conn = {
                R_idx: Fi_M_vertex_index,
                S_idx: Fi_N_vertex_index,
            };

            if (allVertices[i]) {
                const fi_worldVertices = allVertices[i];
                let parentObject = j === 1 ? scene : pivots[j];
                if (!parentObject) {
                    console.error(
                        `Net Gen Error: Parent object not found for F${i}`,
                    );
                    continue;
                }
                const fj_R_target = Fj_R_vertex;
                const fj_S_target = Fj_S_vertex;
                const edgeMidpointWorld = fj_R_target
                    .clone()
                    .add(fj_S_target)
                    .multiplyScalar(0.5);
                const edgeAxisWorld = fj_R_target
                    .clone()
                    .sub(fj_S_target)
                    .normalize();
                const pivot = new THREE.Group();
                pivots[i] = pivot;
                parentObject.updateWorldMatrix(true, true);
                tempMatrix.copy(parentObject.matrixWorld).invert();
                pivot.position.copy(edgeMidpointWorld).applyMatrix4(tempMatrix);
                tempQuatInv
                    .copy(
                        parentObject.getWorldQuaternion(new THREE.Quaternion()),
                    )
                    .invert();
                pivot.userData.axis = edgeAxisWorld
                    .clone()
                    .applyQuaternion(tempQuatInv);
                pivot.quaternion.identity();
                parentObject.add(pivot);
                pivot.getWorldPosition(tempWorldPos);
                const pivotWorldQuaternionInv = pivot
                    .getWorldQuaternion(new THREE.Quaternion())
                    .invert();
                const fi_localVertices = fi_worldVertices.map((worldVert) =>
                    worldVert
                        .clone()
                        .sub(tempWorldPos)
                        .applyQuaternion(pivotWorldQuaternionInv),
                );
                const geometry = createRegularPolygonGeometry(fi_localVertices);
                if (
                    !geometry.attributes.position ||
                    geometry.attributes.position.count === 0
                )
                    throw new Error(`Geometry creation failed for F${i}`);
                const colorValue = parseColor(colorInput);
                const material = new THREE.MeshStandardMaterial({
                    color: colorValue,
                    side: THREE.DoubleSide,
                    roughness: 0.8,
                });
                const faceMesh = new THREE.Mesh(geometry, material);
                faceMesh.position.set(0, 0, 0);
                pivot.add(faceMesh);
                const localCenter = calculateLocalCenter(fi_localVertices);
                const localNormal = calculateLocalNormal(fi_localVertices);
                const arrowHelper = new THREE.ArrowHelper(
                    localNormal,
                    localCenter,
                    L / 2,
                    0x000000,
                    L / 4,
                    L / 8,
                );
                pivot.add(arrowHelper);
                normalHelpers[i] = arrowHelper;
            }
        }
        console.log("Finished creating net geometry.");

        if (toggleNormalsCheckbox)
            setNormalHelpersVisibility(toggleNormalsCheckbox.checked);
        else setNormalHelpersVisibility(false);
    } catch (error) {
        console.error("Error during net creation:", error);
        alert(
            "An error occurred while creating the net geometry. Check console.",
        );
        clearSceneGeometry();
    }
}

// --- Function to set visibility of all normal helpers ---
function setNormalHelpersVisibility(visible) {
    Object.values(normalHelpers).forEach((helper) => {
        if (helper) helper.visible = visible;
    });
}

// --- Event handler for the checkbox ---
function toggleNormalHelpersVisibility() {
    if (toggleNormalsCheckbox)
        setNormalHelpersVisibility(toggleNormalsCheckbox.checked);
}

// --- Button Click Handlers & Animation ---
function getPivotsForStage(stage) {
    const effectiveStage = Math.abs(stage);
    if (effectiveStage >= 1 && effectiveStage <= NUM_ANIMATION_STAGES) {
        const pivotIndex = effectiveStage + 1;
        return pivots[pivotIndex] ? [pivotIndex] : [];
    } else {
        return [];
    }
}

// triggerAnimationStage uses currentFoldAngles lookup table
function triggerAnimationStage(stage) {
    if (!currentFoldAngles) {
        console.warn("Cannot trigger animation: Fold angles not loaded.");
        isAnimating = false;
        return;
    }
    currentAnimationStage = stage;
    pivotsInCurrentStage = getPivotsForStage(stage);
    if (pivotsInCurrentStage.length === 0) {
        isAnimating = false;
        currentAnimationStage = 0;
        pauseButton.disabled = true;
        pauseButton.textContent = "Pause";
        isPaused = false;
        const endStageUnfold = -(NUM_ANIMATION_STAGES + 1);
        if (stage === endStageUnfold) console.log(`Seq unfold complete.`);
        else if (stage === 0 && isFolded) console.log("Seq fold complete.");
        return;
    }
    const unfolding = stage < 0;
    const mPointVec1 = new THREE.Vector3(),
        mPointVec2 = new THREE.Vector3(),
        mPointVec3 = new THREE.Vector3();

    for (const pivotIndex of pivotsInCurrentStage) {
        const pivot = pivots[pivotIndex];
        const faceIndex = pivotIndex;
        const faceData = allVertices[faceIndex];
        if (!pivot || !pivot.parent || !faceData) {
            startQuaternions[pivotIndex] = null;
            targetQuaternions[pivotIndex] = null;
            continue;
        }
        const parent = pivot.parent;
        const parentKey = Object.keys(pivots).find(
            (key) => pivots[key] === parent,
        );
        const parentIndex =
            parent === scene ? 1 : parentKey ? parseInt(parentKey, 10) : null;
        const parentData = parentIndex ? allVertices[parentIndex] : null;
        if (
            !pivot.userData.axis ||
            !parentData ||
            !faceData.conn ||
            !parentData.numSides ||
            !faceData.numSides
        ) {
            startQuaternions[pivotIndex] = null;
            targetQuaternions[pivotIndex] = null;
            continue;
        }

        const sides_i = faceData.numSides;
        const sides_j = parentData.numSides;
        let baseFoldAngleKey = `${sides_i}-${sides_j}`;
        let baseTargetAngle = currentFoldAngles[baseFoldAngleKey];
        if (baseTargetAngle === undefined) {
            baseFoldAngleKey = `${sides_j}-${sides_i}`;
            baseTargetAngle = currentFoldAngles[baseFoldAngleKey];
        }
        if (baseTargetAngle === undefined) {
            console.warn(
                `Using default fold angle for key ${baseFoldAngleKey}.`,
            );
            baseTargetAngle = Math.acos(1 / Math.sqrt(3));
        }
        if (unfolding) baseTargetAngle = 0;

        let angleSign = 1;
        if (!unfolding) {
            const parentWorldVertices = getMeshWorldVertices(parentIndex);
            const centerF = parentWorldVertices
                ? calculateWorldCentroid(parentWorldVertices)
                : null;
            const normalF = parentWorldVertices
                ? calculateWorldNormal(parentWorldVertices)
                : null;
            const vertsG_plus = calculateHypotheticalWorldVertices(
                faceIndex,
                baseTargetAngle,
            );
            const centerG_plus = vertsG_plus
                ? calculateWorldCentroid(vertsG_plus)
                : null;
            const normalG_plus = vertsG_plus
                ? calculateWorldNormal(vertsG_plus)
                : null;
            const vertsG_minus = calculateHypotheticalWorldVertices(
                faceIndex,
                -baseTargetAngle,
            );
            const centerG_minus = vertsG_minus
                ? calculateWorldCentroid(vertsG_minus)
                : null;
            const normalG_minus = vertsG_minus
                ? calculateWorldNormal(vertsG_minus)
                : null;
            const M1 =
                centerF && normalF
                    ? mPointVec1.copy(centerF).add(normalF)
                    : null;
            const M2 =
                centerG_plus && normalG_plus
                    ? mPointVec2.copy(centerG_plus).add(normalG_plus)
                    : null;
            const M2_prime =
                centerG_minus && normalG_minus
                    ? mPointVec3.copy(centerG_minus).add(normalG_minus)
                    : null;
            if (M1 && M2 && M2_prime) {
                const dSq = M1.distanceToSquared(M2);
                const dPrimeSq = M1.distanceToSquared(M2_prime);
                angleSign = dSq > dPrimeSq ? 1 : -1;
            } else {
                angleSign = 1;
            }
        }
        const targetAngleValue = angleSign * baseTargetAngle;
        startQuaternions[pivotIndex] = pivot.quaternion.clone();
        targetQuaternions[pivotIndex] = new THREE.Quaternion().setFromAxisAngle(
            pivot.userData.axis,
            targetAngleValue,
        );
    }
    animationStartTime = performance.now();
    pausedElapsedTime = 0;
    isAnimating = true;
    isPaused = false;
    pauseButton.disabled = false;
    pauseButton.textContent = "Pause";
}

// toggleFold, togglePause, onWindowResize, easeInOutQuad, animate
function toggleFold() {
    if (!currentFoldAngles) {
        alert("Load a net file first.");
        return;
    }
    if (isAnimating && !isPaused) return;
    if (isAnimating && isPaused) {
        togglePause();
        return;
    }
    isPaused = false;
    pauseButton.textContent = "Pause";
    if (!isFolded) {
        triggerAnimationStage(1);
        foldButton.textContent = "Unfold";
    } else {
        triggerAnimationStage(-1);
        foldButton.textContent = "Fold";
    }
    isFolded = !isFolded;
}
function togglePause() {
    if (!isAnimating) return;
    isPaused = !isPaused;
    if (isPaused) {
        pausedElapsedTime = performance.now() - animationStartTime;
        pauseButton.textContent = "Resume";
    } else {
        animationStartTime = performance.now() - pausedElapsedTime;
        pauseButton.textContent = "Pause";
    }
}
function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function animate(currentTime) {
    requestAnimationFrame(animate);
    if (isAnimating && !isPaused) {
        const elapsedTime = currentTime - animationStartTime;
        let progress = Math.min(elapsedTime / currentAnimationDuration, 1);
        const easedProgress = easeInOutQuad(progress);
        for (const pivotIndex of pivotsInCurrentStage) {
            const pivot = pivots[pivotIndex];
            if (
                pivot &&
                startQuaternions[pivotIndex] &&
                targetQuaternions[pivotIndex]
            )
                pivot.quaternion
                    .copy(startQuaternions[pivotIndex])
                    .slerp(targetQuaternions[pivotIndex], easedProgress);
        }
        if (progress >= 1) {
            for (const pivotIndex of pivotsInCurrentStage) {
                const pivot = pivots[pivotIndex];
                if (pivot && targetQuaternions[pivotIndex])
                    pivot.quaternion.copy(targetQuaternions[pivotIndex]);
            }
            let nextStage = 0;
            if (
                currentAnimationStage > 0 &&
                currentAnimationStage < NUM_ANIMATION_STAGES
            )
                nextStage = currentAnimationStage + 1;
            else if (
                currentAnimationStage < 0 &&
                currentAnimationStage > -NUM_ANIMATION_STAGES
            )
                nextStage = currentAnimationStage - 1;
            else if (currentAnimationStage === NUM_ANIMATION_STAGES)
                nextStage = 0; // End fold
            else if (currentAnimationStage === -NUM_ANIMATION_STAGES)
                nextStage = -(NUM_ANIMATION_STAGES + 1); // End unfold
            triggerAnimationStage(nextStage);
        }
    }
    controls.update();
    renderer.render(scene, camera);
}

const presetNets = document.getElementById("presetNets");

presetNets.addEventListener("change", async (e) => {
    const netName = e.target.value;
    if (!netName) return;
    try {
        const response = await fetch(`nets/${netName}.json`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const netData = await response.json();
        console.log(`Processing preset net: ${netName}`);
        loadAndProcessNet(netData);
    } catch (error) {
        console.error("Error loading preset net:", error);
        alert(`Error loading preset net: ${error.message}`);
    } finally {
        presetNets.value = "";
    }
});

// --- Start Application ---
init();
