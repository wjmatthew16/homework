/*-------------------------------------------------------------------------
Homeowrk04.js
---------------------------------------------------------------------------*/
import { resizeAspectRatio, setupText, updateText, Axes } from '../util/util.js';
import { Shader, readShaderFile } from '../util/shader.js';

let isInitialized = false;
const canvas = document.getElementById('glCanvas');
const gl = canvas.getContext('webgl2');
let shader;
let vao;
let axes;
let lastTime = 0;

let S_Angle = 0;
let E_Orb_Angle = 0;
let E_Rot_Angle = 0;
let M_Orb_Angle = 0;
let M_Rot_Angle = 0;

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
    const cubeVertices = new Float32Array([
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

    // VBO for position
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    shader.setAttribPointer("a_position", 2, gl.FLOAT, false, 0, 0); 

    // EBO
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    //colorBuffer가 꼬이는 거 같아서 color 관련 삭제하고 uniform으로 돌림 
}

function drawSquare(modelMatrix, color){  //도형 각각 그리기
    shader.use();
    shader.setMat4("u_model", modelMatrix); //uniform 
    shader.setVec4("u_color", color);   //uniform

    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT,0);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 축 그리기
    axes.draw(mat4.create(), mat4.create());

    // Sun (돌리고 줄이고)
    let model = mat4.create();
    mat4.rotate(model, model, S_Angle, [0, 0, 1]);
    mat4.scale(model, model, [0.2, 0.2, 1]);
    drawSquare(model, [1, 0, 0, 1]); //Red

    // Earth (공전하고 자전하고 줄이고)
    model = mat4.create();
    mat4.rotate(model, model, E_Orb_Angle, [0, 0, 1]);
    mat4.translate(model, model, [0.7, 0, 0]); //공전궤도반지름 0.7
    mat4.rotate(model, model, E_Rot_Angle, [0, 0, 1]);
    mat4.scale(model, model, [0.1, 0.1, 1]);
    drawSquare(model, [0, 1, 1, 1]); //Cyan

    // Moon (태양 기준 먼저 공전하고 지구 기준 공전하고 자전하고 줄이고)
    let moon = mat4.create();
    mat4.rotate(moon, moon, E_Orb_Angle, [0, 0, 1]);
    mat4.translate(moon, moon, [0.7, 0, 0]);
    mat4.rotate(moon, moon, M_Orb_Angle, [0, 0, 1]);
    mat4.translate(moon, moon, [0.2, 0, 0]);
    mat4.rotate(moon, moon, M_Rot_Angle, [0, 0, 1]);
    mat4.scale(moon, moon, [0.05, 0.05, 1]);
    drawSquare(moon, [1, 1, 0, 1]); //Yello
}

function animate(currentTime) { 

    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000; 
    lastTime = currentTime;

    S_Angle += Math.PI / 4 * deltaTime; //45도 자전
    E_Orb_Angle += Math.PI / 6 * deltaTime; //30도 공전
    E_Rot_Angle += Math.PI * deltaTime; //180도 자전
    M_Orb_Angle += 2 * Math.PI * deltaTime; //360도 공전
    M_Rot_Angle += Math.PI * deltaTime; //180도 자전

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
        axes = new Axes(gl, 1.0); 

        return true;
    } catch (error) {
        console.error('Failed to initialize program:', error);
        alert('프로그램 초기화에 실패했습니다.');
        return false;
    }
}
