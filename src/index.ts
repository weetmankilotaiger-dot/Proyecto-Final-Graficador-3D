import { Obj3D } from './Obj3D.js';
import { CvZbuf } from './CvZbuf.js';

let canvas: HTMLCanvasElement;
let graphics: CanvasRenderingContext2D;

canvas = <HTMLCanvasElement>document.getElementById('circlechart');
graphics = canvas.getContext('2d');

let cv: CvZbuf;
let obj: Obj3D;

function leerArchivo(e:any) {
  var archivo = e.target.files[0];
  if (!archivo) {
    return;
  }
  
  // Mostrar nombre del archivo
  document.getElementById('file-name-display').innerText = archivo.name;
  
  var lector = new FileReader();
  lector.onload = function(e) {
    var contenido = e.target.result as string;
    
    // Mostrar en visor crudo
    const rawTextEl = document.getElementById('raw-file-content') as HTMLTextAreaElement;
    if (rawTextEl) rawTextEl.value = contenido;
    
    obj = new Obj3D();
    if (obj.read(contenido)) {
      cv = new CvZbuf(graphics, canvas);
      cv.setObj(obj);
      cv.paint();
      
      // Actualizar estadisticas de Vertices y Caras (Triangulos)
      const verts = obj.w.length - 1; // El vertice 0 no se usa
      const tris = obj.getPolyList().length;
      
      document.getElementById('stat-verts').innerText = verts.toString();
      document.getElementById('bottom-stat-verts').innerText = verts.toString();
      
      document.getElementById('stat-tris').innerText = tris.toString();
      document.getElementById('bottom-stat-tris').innerText = tris.toString();
      
      // Init sliders values based on object defaults
      updateLightingFromObj();
    }
  };
  lector.readAsText(archivo);
}

function vp(dTheta:number, dPhi:number, fRho:number):void{  // Viewpoint
  if (obj != undefined) {
    let currentObj: Obj3D = cv.getObj();
    if (!currentObj.vp(cv, dTheta, dPhi, fRho))
      console.log('datos no validos o limites de zoom alcanzados');
  }
}

// Eventos
document.getElementById('file-input').addEventListener('change', leerArchivo, false);

let Pix: number, Piy: number;
let Pfx: number, Pfy: number;
let flag: boolean = false;
let autoRotating: boolean = false;
let animationFrameId: number;

function toggleAutoRotate() {
  if (!obj) {
    alert('Primero carga un modelo 3D.');
    return;
  }
  
  autoRotating = !autoRotating;
  const btn = document.getElementById('btn-auto-rotate');
  
  if (autoRotating) {
    btn.innerHTML = 'II Detener';
    btn.classList.add('active-red');
    rotateLoop();
  } else {
    btn.innerHTML = '▶ Animar';
    btn.classList.remove('active-red');
    cancelAnimationFrame(animationFrameId);
  }
}

function rotateLoop() {
  if (!autoRotating) return;
  let speedVal = parseFloat((<HTMLInputElement>document.getElementById('input-velocidad')).value) || 45;
  // Convert 0-180 scale to a small rotation angle per frame
  let dTheta = speedVal * 0.0005;
  vp(dTheta, 0, 1);
  animationFrameId = requestAnimationFrame(rotateLoop);
}

document.getElementById('btn-auto-rotate').addEventListener('click', toggleAutoRotate, false);

// Manipulación 360 (Ratón)
function handleMouse(evento: any) {
  Pix = evento.offsetX;
  Piy = evento.offsetY;
  flag = true;
}

function makeVizualization(evento: any) {
  if (flag && obj) {
    Pfx = evento.offsetX;
    Pfy = evento.offsetY;
    let difX = Pfx - Pix;
    let difY = Pfy - Piy;
    
    // Mejor sensibilidad para 360 grados
    vp(-difX * 0.01, difY * 0.01, 1);
    
    Pix = Pfx;
    Piy = Pfy;
  }
}

function noDraw() {
  flag = false;
}

canvas.addEventListener('mousedown', handleMouse);
canvas.addEventListener('mouseup', noDraw);
canvas.addEventListener('mousemove', makeVizualization);
canvas.addEventListener('mouseleave', noDraw);

// Eventos de Sliders de UI
function setupSliders() {
  const inputs = ['velocidad', 'luzX', 'luzY', 'luzZ', 'eyeZ', 'fov'];
  inputs.forEach(id => {
    const el = document.getElementById(`input-${id}`);
    const valEl = document.getElementById(`val-${id}`);
    if (el && valEl) {
      el.addEventListener('input', (e: any) => {
        let val = e.target.value;
        if (id === 'velocidad') {
          valEl.innerText = `${val}.0°/s`;
          document.getElementById('bottom-stat-vel').innerText = `${val}°/s`;
        } else if (id === 'eyeZ') {
          valEl.innerText = parseFloat(val).toFixed(1);
          if (obj) {
            // Map the generic slider (1 to 20) to actual eye distance based on obj's bounds
            // rhoMin is the closest distance. Default rho is 3 * rhoMin.
            obj.rho = obj.rhoMin * parseFloat(val);
            if (cv) cv.paint();
          }
        } else if (id === 'fov') {
          valEl.innerText = `${val}°`;
          if (obj) {
            // Default FOV slider is 38. We map 38 to a multiplier of 1.0.
            obj.zoomMultiplier = 38.0 / parseFloat(val);
            if (cv) cv.paint();
          }
        } else {
          valEl.innerText = parseFloat(val).toFixed(2);
          updateLightingToObj();
        }
      });
    }
  });
}
setupSliders();

function updateLightingFromObj() {
  if (!obj) return;
  (<HTMLInputElement>document.getElementById('input-luzX')).value = obj.sunX.toFixed(2);
  document.getElementById('val-luzX').innerText = obj.sunX.toFixed(2);
  
  (<HTMLInputElement>document.getElementById('input-luzY')).value = obj.sunY.toFixed(2);
  document.getElementById('val-luzY').innerText = obj.sunY.toFixed(2);
  
  (<HTMLInputElement>document.getElementById('input-luzZ')).value = obj.sunZ.toFixed(2);
  document.getElementById('val-luzZ').innerText = obj.sunZ.toFixed(2);
  
  // Reset camera sliders to default when a new object is loaded
  const eyeZInput = <HTMLInputElement>document.getElementById('input-eyeZ');
  const eyeZVal = document.getElementById('val-eyeZ');
  if (eyeZInput && eyeZVal) {
    eyeZInput.value = '3.0';
    eyeZVal.innerText = '3.0';
    obj.rho = obj.rhoMin * 3.0;
  }
  
  const fovInput = <HTMLInputElement>document.getElementById('input-fov');
  const fovVal = document.getElementById('val-fov');
  if (fovInput && fovVal) {
    fovInput.value = '38';
    fovVal.innerText = '38°';
    obj.zoomMultiplier = 1.0;
  }
}

function updateLightingToObj() {
  if (!obj) return;
  let lx = parseFloat((<HTMLInputElement>document.getElementById('input-luzX')).value);
  let ly = parseFloat((<HTMLInputElement>document.getElementById('input-luzY')).value);
  let lz = parseFloat((<HTMLInputElement>document.getElementById('input-luzZ')).value);
  
  // Normalize vector
  let len = Math.sqrt(lx*lx + ly*ly + lz*lz);
  if (len === 0) { lx = 0; ly = 1; lz = 0; len = 1; }
  
  obj.sunX = lx / len;
  obj.sunY = ly / len;
  obj.sunZ = lz / len;
  
  if (cv) cv.paint();
}

// Resize handling básico
function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  if (container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (obj && cv) {
      cv.paint();
    }
  }
}
// Setup color palette swatches
function setupColorSwatches() {
  const swatches = document.querySelectorAll('.color-swatch');
  swatches.forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      swatches.forEach(s => s.classList.remove('active'));
      let target = e.target as HTMLElement;
      target.classList.add('active');
      
      const bg = window.getComputedStyle(target).backgroundColor;
      const match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match && obj) {
        obj.baseColorR = parseInt(match[1]);
        obj.baseColorG = parseInt(match[2]);
        obj.baseColorB = parseInt(match[3]);
        if (cv) cv.paint();
      }
    });
  });
}
setupColorSwatches();

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);

// D-Pad Rotation Handling
let manualRotationInterval: number;

function startManualRotation(dTheta: number, dPhi: number, fRho: number = 1) {
  if (!obj) return;
  // Rotate/zoom once immediately
  vp(dTheta, dPhi, fRho);
  // Then start interval for continuous action
  clearInterval(manualRotationInterval);
  manualRotationInterval = window.setInterval(() => {
    vp(dTheta, dPhi, fRho);
  }, 30); // 30ms for smooth ~30fps
}

function stopManualRotation() {
  clearInterval(manualRotationInterval);
}

function setupDPad() {
  const btnUp = document.getElementById('btn-rot-up');
  const btnDown = document.getElementById('btn-rot-down');
  const btnLeft = document.getElementById('btn-rot-left');
  const btnRight = document.getElementById('btn-rot-right');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');

  const addHoldEvents = (btn: HTMLElement, dTheta: number, dPhi: number, fRho: number = 1) => {
    if (!btn) return;
    btn.addEventListener('mousedown', () => startManualRotation(dTheta, dPhi, fRho));
    btn.addEventListener('mouseup', stopManualRotation);
    btn.addEventListener('mouseleave', stopManualRotation);
    
    // Touch support for mobile
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); startManualRotation(dTheta, dPhi, fRho); });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); stopManualRotation(); });
    btn.addEventListener('touchcancel', (e) => { e.preventDefault(); stopManualRotation(); });
  };

  const rotSpeed = 0.05; // Base rotation speed for D-pad
  addHoldEvents(btnUp, 0, rotSpeed);
  addHoldEvents(btnDown, 0, -rotSpeed);
  addHoldEvents(btnLeft, -rotSpeed, 0);
  addHoldEvents(btnRight, rotSpeed, 0);
  
  // Zoom functionality for buttons (continuous)
  addHoldEvents(btnZoomIn, 0, 0, 0.95);
  addHoldEvents(btnZoomOut, 0, 0, 1.05);
}
setupDPad();

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault(); // Stop page from scrolling
  if (!obj) return;
  if (e.deltaY < 0) {
    vp(0, 0, 0.9); // Zoom in
  } else {
    vp(0, 0, 1.1); // Zoom out
  }
});

// Cargar modelo por defecto al iniciar
window.addEventListener('load', () => {
  fetch('balon.txt')
    .then(response => response.text())
    .then(contenido => {
      let fileNameDisplay = document.getElementById('file-name-display');
      if (fileNameDisplay) fileNameDisplay.innerText = 'balon.txt';
      
      const rawTextEl = document.getElementById('raw-file-content') as HTMLTextAreaElement;
      if (rawTextEl) rawTextEl.value = contenido;
      
      obj = new Obj3D();
      if (obj.read(contenido)) {
        // Establecer color naranja oficial para el balon
        obj.baseColorR = 255;
        obj.baseColorG = 100;
        obj.baseColorB = 0;
        
        cv = new CvZbuf(graphics, canvas);
        cv.setObj(obj);
        cv.paint();
        
        const verts = obj.w.length - 1;
        const tris = obj.getPolyList().length;
        
        let statVerts = document.getElementById('stat-verts');
        if (statVerts) statVerts.innerText = verts.toString();
        
        let bottomStatVerts = document.getElementById('bottom-stat-verts');
        if (bottomStatVerts) bottomStatVerts.innerText = verts.toString();
        
        let statTris = document.getElementById('stat-tris');
        if (statTris) statTris.innerText = tris.toString();
        
        let bottomStatTris = document.getElementById('bottom-stat-tris');
        if (bottomStatTris) bottomStatTris.innerText = tris.toString();
        
        updateLightingFromObj();
        
        // Auto-start rotation
        if (!autoRotating) {
          toggleAutoRotate();
        }
      }
    })
    .catch(err => console.error('Error loading default model:', err));
});