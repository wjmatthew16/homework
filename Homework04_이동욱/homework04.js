import { resizeAspectRatio, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let lastTime = 0;
let axes;
let sunTransform = mat4.create();
let earthTransform = mat4.create();
let moonTransform = mat4.create();

let sunRotation = 0;
let earthRotation = 0;
let earthRevolution = 0;
let moonRotation = 0;
let moonRevolution = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) {
        console.log("Already initialized");
        return;
    }

    main().then(success => {
        if (!success) {
            console.log('프로그램을 종료합니다.');
            return;
        }
        isInitialized = true;
        requestAnimationFrame(animate);
    }).catch(error => {
        console.error('프로그램 실행 중 오류 발생:', error);
    });
});

function initWebGL() {
    if (!gl) {
        console.error('WebGL 2 is not supported by your browser.');
        return false;
    }

    canvas.width = 700;
    canvas.height = 700;
    resizeAspectRatio(gl, canvas);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.2, 0.3, 0.4, 1.0);
    
    return true;
}

function setupBuffers() {
    const squareVertices = new Float32Array([
        -0.5,  0.5, 
        -0.5, -0.5, 
         0.5, -0.5, 
         0.5,  0.5  
    ]);

    const indices = new Uint16Array([
        0, 1, 2,    
        0, 2, 3     
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, squareVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0);


    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
}

function updateTransforms(deltaTime) {
    
    sunRotation += (45 * Math.PI / 180) * deltaTime;

    earthRotation += (180 * Math.PI / 180) * deltaTime;
    earthRevolution += (30 * Math.PI / 180) * deltaTime;

    moonRotation += (180 * Math.PI / 180) * deltaTime;
    moonRevolution += (360 * Math.PI / 180) * deltaTime;

    // 태양 변환 행렬
    sunTransform = mat4.create();
    earthTransform = mat4.create();
    moonTransform = mat4.create();

    mat4.rotate(sunTransform, sunTransform, sunRotation, [0, 0, 1]);
    mat4.scale(sunTransform, sunTransform, [0.2, 0.2, 1]);

    // 지구 공전 경로 행렬
    const earthOrbit = mat4.create();
    mat4.rotate(earthOrbit, earthOrbit, earthRevolution, [0, 0, 1]);
    mat4.translate(earthOrbit, earthOrbit, [0.7, 0, 0]);

    // 지구 최종 변환 행렬 
    mat4.rotate(earthTransform, earthOrbit, earthRotation, [0, 0, 1]);
    mat4.scale(earthTransform, earthTransform, [0.1, 0.1, 1]);

    // 달 공전 경로 
    const moonOrbit = mat4.create();
    mat4.rotate(moonOrbit, moonOrbit, moonRevolution, [0, 0, 1]);
    mat4.translate(moonOrbit, moonOrbit, [0.2, 0, 0]);

    const moonBase = mat4.create(); 
    mat4.multiply(moonBase, earthOrbit, moonOrbit);

    // 달 최종 변환 행렬
    mat4.rotate(moonTransform, moonBase, moonRotation, [0, 0, 1]);
    mat4.scale(moonTransform, moonTransform, [0.05, 0.05, 1]);
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    axes.draw(mat4.create(), mat4.create()); 
    
    shader.use();
    gl.bindVertexArray(vao);

    shader.setMat4("u_transform", sunTransform);
    shader.setVec4("u_color", 1.0, 0.0, 0.0, 1.0); // 노란색
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_transform", earthTransform);
    shader.setVec4("u_color", 0.0, 1.0, 1.0, 1.0); // 파란색
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    shader.setMat4("u_transform", moonTransform);
    shader.setVec4("u_color", 1.0, 1.0, 0.0, 1.0); // 회색
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
}


function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    updateTransforms(deltaTime);
    render();
    requestAnimationFrame(animate);
}

async function initShader() {
    const vertexShaderSource = await readShaderFile('shVert.glsl');
    const fragmentShaderSource = await readShaderFile('shFrag.glsl');
    shader = new Shader(gl, vertexShaderSource, fragmentShaderSource);
}

async function main() {
    try {
        if (!initWebGL()) {
            throw new Error('WebGL 초기화 실패');
        }
        
        await initShader();

        setupBuffers();
        axes = new Axes(gl, 1);
        

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
