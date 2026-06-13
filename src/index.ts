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
  if (cv && cv.getObjs().length > 0) {
    cv.getObjs().forEach(o => {
      o.vp(cv, dTheta, dPhi, fRho);
    });
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
  // Al hacer click, cerrar la pinza
  if (cv && cv.getObjs().length > 1) {
     let movil = cv.getObjs()[1];
     movil.localRotZ = -(25 * Math.PI) / 180.0;
     const apSlider = <HTMLInputElement>document.getElementById('input-apertura');
     if (apSlider) {
       apSlider.value = '25';
       document.getElementById('val-apertura').innerText = '25°';
     }
     cv.paint();
  }
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
  // Al soltar el click, abrir la pinza
  if (cv && cv.getObjs().length > 1) {
     let movil = cv.getObjs()[1];
     movil.localRotZ = 0;
     const apSlider = <HTMLInputElement>document.getElementById('input-apertura');
     if (apSlider) {
       apSlider.value = '0';
       document.getElementById('val-apertura').innerText = '0°';
     }
     cv.paint();
  }
}

canvas.addEventListener('mousedown', handleMouse);
canvas.addEventListener('mouseup', noDraw);
canvas.addEventListener('mousemove', makeVizualization);
canvas.addEventListener('mouseleave', noDraw);

// Eventos de Sliders de UI
function setupSliders() {
  const inputs = ['velocidad', 'luzX', 'luzY', 'luzZ', 'eyeZ', 'fov', 'apertura'];
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
        } else if (id === 'apertura') {
          valEl.innerText = `${val}°`;
          if (cv && cv.getObjs().length > 1) {
            let movil = cv.getObjs()[1];
            movil.localRotZ = -(parseFloat(val) * Math.PI) / 180.0;
            cv.paint();
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

// Actualizar iluminación en el objeto
function updateLightingToObj() {
  if (!obj) return;
  const lx = parseFloat((<HTMLInputElement>document.getElementById('input-luzX')).value);
  const ly = parseFloat((<HTMLInputElement>document.getElementById('input-luzY')).value);
  const lz = parseFloat((<HTMLInputElement>document.getElementById('input-luzZ')).value);
  
  if (cv && cv.getObjs().length > 0) {
    cv.getObjs().forEach(o => {
      o.sunX = lx;
      o.sunY = ly;
      o.sunZ = lz;
    });
    cv.paint();
  }
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

// Cargar pinza por defecto al iniciar
window.addEventListener('load', () => {
  cv = new CvZbuf(graphics, canvas);
  Promise.all([
    fetch('pinza_base.txt').then(r => r.text()),
    fetch('pinza_movil.txt').then(r => r.text())
  ]).then(([baseData, movilData]) => {
    
    let baseObj = new Obj3D();
    if (baseObj.read(baseData)) {
      baseObj.baseColorR = 190;
      baseObj.baseColorG = 190;
      baseObj.baseColorB = 195;
      cv.addObj(baseObj);
    }
    
    let movilObj = new Obj3D();
    if (movilObj.read(movilData)) {
      movilObj.baseColorR = 190;
      movilObj.baseColorG = 190;
      movilObj.baseColorB = 195;
      movilObj.pivotX = 0;
      movilObj.pivotY = 0;
      movilObj.pivotZ = 0;
      cv.addObj(movilObj);
    }
    
    obj = baseObj;
    updateLightingToObj();
    cv.getObjs().forEach(o => {
      o.sunX = obj.sunX;
      o.sunY = obj.sunY;
      o.sunZ = obj.sunZ;
    });
    
    const verts = baseObj.w.length + movilObj.w.length - 2;
    const tris = baseObj.getPolyList().length + movilObj.getPolyList().length;
    
    let statVerts = document.getElementById('stat-verts');
    if (statVerts) statVerts.innerText = verts.toString();
    
    let statTris = document.getElementById('stat-tris');
    if (statTris) statTris.innerText = tris.toString();
    
    let fileNameDisplay = document.getElementById('file-name-display');
    if (fileNameDisplay) fileNameDisplay.innerText = 'Pinza Articulada';
    
    const rawTextEl = document.getElementById('raw-file-content') as HTMLTextAreaElement;
    if (rawTextEl) rawTextEl.value = "Multi-part object loaded.\n- pinza_base.txt\n- pinza_movil.txt";
    
    updateLightingFromObj();
    cv.paint();
    
    if (!autoRotating) {
      toggleAutoRotate();
    }
  }).catch(err => console.error('Error loading default model:', err));
});