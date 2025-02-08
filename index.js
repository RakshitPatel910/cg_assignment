import { Scene, Shape, WebGLRenderer, Shader, SelectionManager, KeyboardShapeCreator } from './lib/threeD.js';
import { vertexShaderSrc } from './shaders/vertex.js';
import { fragmentShaderSrc } from './shaders/fragment.js';

const canvContainer = document.getElementById("canvas_container");

console.log(canvContainer)

const renderer = new WebGLRenderer();
renderer.setSize(756, 756);
canvContainer.appendChild(renderer.domElement);

const shader = new Shader(renderer.glContext(), vertexShaderSrc, fragmentShaderSrc);
shader.use();

const scene = new Scene();

let createShape = true;

const currentVertices = [];
let currentColor = [1, 1, 0, 1];

const identityMatrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
];


let selectedShape = null;
let selectedShapes = [];

const selectedList = document.getElementById("status_selected_shape");
function updateSelectedList() {
    if(selectedShapes.length === 0){
        selectedList.innerHTML = "Shape Selected: None";

        return;
    }

    let s = "Shape Selected: ";

    selectedShapes.forEach((sh) => {
        console.log(sh.id)
        s += `${sh.id}, `;
    });

    s = s.slice(0, -2);

    selectedList.innerHTML = s;
}

let prevSelectedShape = null;


document.addEventListener('keydown', (event) => {
    if ( selectedShapes.length === 0 ) return;

    const speed = event.shiftKey ? 0.02 : 0.02;
    
    switch(event.key) {
        case 'ArrowUp':
            // selectedShape.transform.translate[1] += speed;
            // break;
            selectedShapes.forEach( (s) => {
                s.transform.translate[1] += speed;
            });
            break;
        case 'ArrowDown':
            // selectedShape.transform.translate[1] -= speed;
            // break;
            selectedShapes.forEach( (s) => {
                s.transform.translate[1] -= speed;
            });
            break;
        case 'ArrowLeft':
            // selectedShape.transform.translate[0] -= speed;
            // break;
            selectedShapes.forEach( (s) => {
                s.transform.translate[0] -= speed;
            });
            break;
        case 'ArrowRight':
            // selectedShape.transform.translate[0] += speed;
            // break;
            selectedShapes.forEach( (s) => {
                s.transform.translate[0] += speed;
            });
            break;
        case 'z':
            scene.bringToFront(selectedShapes);
            break;
        case 'x':
            scene.sendToBack(selectedShapes);
            break;
    }
    
    // selectedShape.transform.updateModelTransformMatrix();
});




let transformState = {
    mode : null,
    keyPressed : false,
    lastX : 0,
    lastY : 0,
    sensitivity : 0.05
}

const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if(e.key === 's') transformState.mode = 'scale';
    if(e.key === 'r') transformState.mode = 'rotate';
    if(e.key === 't') transformState.mode = 'translate';
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    if (!keys.s && !keys.r && !keys.t) transformState.mode = null;
});



function getShapeCentroid(shape) {
    const sum = shape.vertices.reduce((acc, v) => {
        acc.x += v[0];
        acc.y += v[1];
        return acc;
    }, { x: 0, y: 0 });
    
    return [
        sum.x / shape.vertices.length,
        sum.y / shape.vertices.length
    ];
}

renderer.domElement.addEventListener('wheel', (e) => {
    if(!selectedShape || !transformState.mode) return;
    e.preventDefault();

    const delta = e.deltaY * (keys.shift ? 0.1 : 1) * transformState.sensitivity;

    const centroid = getShapeCentroid(selectedShape);

    switch (transformState.mode) {
        case 'scale':
            selectedShapes.forEach( (s) => {
                const scaleFactor = (e.deltaY > 0 ? 0.025 : -0.025);
                s.transform.scale[0] += scaleFactor;
                s.transform.scale[1] += scaleFactor;
            })
            break;
    
        case 'rotate':
            selectedShapes.forEach( (s) => {
                s.transform.rotationAngle += delta * (e.deltaY > 0 ? 0.025 : 0.025);
            })
            break;
    }

    selectedShape.transform.updateModelTransformMatrix();
});

renderer.domElement.addEventListener('mousemove', (e) => {
    if(!selectedShape || !transformState.mode != 'translate') return;

    const rect = renderer.domElement.getBoundingClientRect();
    const [x, y] = [
        (e.clientX - rect.left) / rect.width * 2 - 1,
        1 - (e.clientY - rect.top) /rect.height * 2
    ];

    if (transformState.lastX != null && transformState.lastY != null) {
        const dx = x - transformState.lastX;
        const dy = y - transformState.lastY;

        selectedShape.transform.translate[0] += dx;
        selectedShape.transform.translate[1] += dy;

        selectedShape.transform.updateModelTransformMatrix();
    }

    transformState.lastX = x;
    transformState.lastY = y;
});



renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());


const ksc = new KeyboardShapeCreator(renderer, scene, shader, ()=>{
    const temp = currentColor;
    currentColor = [Math.random(), Math.random(), Math.random(), 1];
    return temp;
}, currentVertices);


const totalShapes = document.getElementById('status_total_shapes');


renderer.domElement.addEventListener('mousedown', (event) => {
    console.log(scene.primitives.length)
    
    if (event.button === 0) {
        if(!createShape || scene.maxShapes === scene.primitives.length) return;
        const clipCoords = renderer.mouseToClipCoord(event);
        console.log(clipCoords)
        currentVertices.push(clipCoords);

        if(currentVertices.length === 1) ksc.startCreation();

        ksc.update();
    }
    else if (event.button === 1) {
        const rect = renderer.domElement.getBoundingClientRect();

        selectedShape = SelectionManager.getShapeAtPosition(
            scene,
            renderer.glContext(),
            event.clientX - rect.left,
            event.clientY - rect.top
        );

        if (selectedShape && !selectedShape.isSelected) {
            scene.selectedShape = selectedShape;
            selectedShape.originalColor = [...selectedShape.color];
            selectedShape.isSelected = true;
            selectedShapes.push(selectedShape);
        }
        else if(selectedShape && selectedShape.isSelected) {
            selectedShape.isSelected = false;
            selectedShapes.splice(selectedShapes.indexOf(selectedShape), 1);
        }
        console.log(selectedShapes)

        updateSelectedList();
    }
    else if (event.button === 2) {
        if (currentVertices.length >= 3) {
            const shape = new Shape(currentVertices, currentColor, scene.prevShapeId + 1);
            scene.prevShapeId++;
            scene.add(shape);
            currentVertices.length = 0;
            currentColor = [Math.random(), Math.random(), Math.random(), 1];

            totalShapes.innerHTML = `Total Shapes : ${scene.primitives.length} ${scene.maxShapes === scene.primitives.length ? '(Max Shapes Drawn!)' : ''}`;
        }
    }
});


function selectAll() {
    selectedShapes.length = 0;

    scene.primitives.forEach((s) => {
        s.isSelected = true;

        selectedShapes.push(s);

        updateSelectedList();
    });
}
const btnSelectAll = document.getElementById("btn_select_all");
btnSelectAll.addEventListener('click', selectAll);

function unselectAll() {
    console.log('clicked')
    selectedShapes.forEach((s) => {
        s.isSelected = false;
    });

    selectedShapes.length = 0;
    updateSelectedList();
}
const btnUnselectAll = document.getElementById("btn_unselect_all");
btnUnselectAll.addEventListener('click', unselectAll);



function deleteAllShapes() {
    scene.primitives.length = 0;
    
    totalShapes.innerHTML = `Total Shapes : ${scene.primitives.length}`;

    selectedShapes.length = 0;
    updateSelectedList();
}
const btnDeleteAll = document.getElementById("btn_delete_all");
btnDeleteAll.addEventListener('click', deleteAllShapes);



const indStat = document.getElementById("indicator_status");
document.addEventListener('keydown', (e) => {
    console.log('h')
    if(e.key === 'h') ksc.flipIndicator();

    if(ksc.indicator) indStat.innerHTML ='Indicator Status : Show';
    else indStat.innerHTML = 'Indicator Status : Hidden';
});



const maxS = document.getElementById("max_shapes");
maxS.innerHTML = `Max Shapes : ${scene.maxShapes}`

const btnIncreaseMax = document.getElementById('btn_increase_max');
const btnDecreaseMax = document.getElementById('btn_decrease_max');
function updateMaxShapes() {
    maxS.innerHTML = `Max Shapes : ${scene.maxShapes}`;
}

btnIncreaseMax.addEventListener('click', () => {
    if(scene.primitives.length != 0) return;

    scene.maxShapes++;
    updateMaxShapes();
});

btnDecreaseMax.addEventListener('click', () => {
    if(scene.primitives.length != 0) return;

    if (scene.maxShapes > 1) {
        scene.maxShapes--;
        updateMaxShapes();
    }
});



const btnCreateShape = document.getElementById("btn_create_shape");
function flipCreateShape() {
    createShape = !createShape;
    
    ksc.active = !ksc.active;

    const shbtn = document.getElementById("create_shape_text");
    shbtn.innerHTML = `Create Shape : ${createShape ? 'On' : 'Off'}`;

    btnCreateShape.innerHTML = `Turn ${createShape ? 'Off' : 'On'}`
}
btnCreateShape.addEventListener('click', flipCreateShape);







renderer.setAnimationLoop(() => {
    renderer.clear(0.9, 0.9, 0.9, 1);
    
    renderer.render(scene, shader);
   
    if (currentVertices.length > 0) {
        const tempArray = new Float32Array(currentVertices.flatMap(v => [v[0], v[1], 0]));
        shader.bindArrayBuffer(shader.vertexAttributesBuffer, tempArray);
        shader.fillAttributeData("aPosition", tempArray, 3, 0, 0);
        shader.setUniformMatrix4fv("uModelMatrix", identityMatrix);
        renderer.glContext().drawArrays(renderer.glContext().LINE_STRIP, 0, currentVertices.length);
        renderer.glContext().drawArrays(renderer.glContext().POINTS, 0, currentVertices.length);
    }

    ksc.update();
});