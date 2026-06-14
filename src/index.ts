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

// Estado de los pétalos
let petalsOpen: boolean = false;
let petalTargetAngle: number = 0;    // Ángulo objetivo
let petalCurrentAngle: number = 0;   // Ángulo actual (para animación suave)
let breezeTime: number = 0;          // Tiempo para animación de brisa

// Manipulación 360 (Ratón)
function handleMouse(evento: any) {
  Pix = evento.offsetX;
  Piy = evento.offsetY;
  flag = true;
  // Al hacer click, alternar pétalos abiertos/cerrados
  if (cv && cv.getObjs().length > 1) {
     petalsOpen = !petalsOpen;
     // Abierto: -10 grados. Cerrado como capullo: -85 grados (hacia arriba).
     petalTargetAngle = petalsOpen ? -10 : -85;
     const apSlider = <HTMLInputElement>document.getElementById('input-apertura');
     if (apSlider) {
       apSlider.value = petalTargetAngle.toString();
       document.getElementById('val-apertura').innerText = petalTargetAngle + '°';
     }
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
            petalTargetAngle = parseFloat(val);
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

// Cargar flor por defecto al iniciar
window.addEventListener('load', () => {
  cv = new CvZbuf(graphics, canvas);
  
  const NUM_PETALS = 6;
  const flowerFiles = ['flor_centro.txt'];
  for (let i = 0; i < NUM_PETALS; i++) {
    flowerFiles.push(`flor_petalo_${i}.txt`);
  }
  
  Promise.all(flowerFiles.map(f => fetch(f).then(r => r.text())))
    .then((dataArr) => {
      // Colores para cada parte
      const petalColors = [
        {r: 255, g: 80,  b: 120},  // Rosa fuerte
        {r: 255, g: 120, b: 80},   // Coral
        {r: 255, g: 60,  b: 100},  // Rosa intenso
        {r: 255, g: 140, b: 90},   // Salmon
        {r: 255, g: 70,  b: 110},  // Rosa medio
        {r: 255, g: 100, b: 70},   // Naranja rosado
      ];
      
      let totalVerts = 0;
      let totalTris = 0;
      
      dataArr.forEach((data, idx) => {
        let partObj = new Obj3D();
        if (partObj.read(data)) {
          if (idx === 0) {
            // Centro + tallo: verde oscuro
            partObj.baseColorR = 50;
            partObj.baseColorG = 160;
            partObj.baseColorB = 50;
          } else {
            // Pétalos: colores vibrantes
            let c = petalColors[(idx - 1) % petalColors.length];
            partObj.baseColorR = c.r;
            partObj.baseColorG = c.g;
            partObj.baseColorB = c.b;
          }
          cv.addObj(partObj);
          totalVerts += partObj.w.length - 1;
          totalTris += partObj.getPolyList().length;
        }
      });
      
      obj = cv.getObjs()[0];
      
      // Sincronizar iluminación
      cv.getObjs().forEach(o => {
        o.sunX = 1.0;
        o.sunY = 2.0;
        o.sunZ = 1.5;
      });
      
      let statVerts = document.getElementById('stat-verts');
      if (statVerts) statVerts.innerText = totalVerts.toString();
      
      let statTris = document.getElementById('stat-tris');
      if (statTris) statTris.innerText = totalTris.toString();
      
      let fileNameDisplay = document.getElementById('file-name-display');
      if (fileNameDisplay) fileNameDisplay.innerText = 'Flor Articulada (6 petalos)';
      
      const rawTextEl = document.getElementById('raw-file-content') as HTMLTextAreaElement;
      if (rawTextEl) rawTextEl.value = flowerFiles.join('\n');
      // Configurar ejes de rotación para cada pétalo
      // Cada pétalo rota alrededor de un eje PERPENDICULAR a su dirección radial (en el plano XY)
      const objs = cv.getObjs();
      const NUM_PETALS = 6;
      for (let i = 1; i <= NUM_PETALS; i++) {
        let petalAngle = (i - 1) * (2 * Math.PI / NUM_PETALS);
        // El eje de rotación es perpendicular al radio del pétalo, en el plano XY
        objs[i].localRotAxisX = -Math.sin(petalAngle);
        objs[i].localRotAxisY = Math.cos(petalAngle);
        objs[i].localRotAxisZ = 0;
        
        // Pivot en la BASE del pétalo (radio 0.55), no en el centro absoluto
        // Así el pétalo se dobla desde su nacimiento sin despegarse del domo
        let distBase = 0.55;
        objs[i].pivotX = distBase * Math.cos(petalAngle);
        objs[i].pivotY = distBase * Math.sin(petalAngle);
        objs[i].pivotZ = 0;
      }
      
      updateLightingFromObj();
      cv.paint();
      
      if (!autoRotating) {
        toggleAutoRotate();
      }
      
      // Animación continua: brisa + apertura suave de pétalos
      function animateFlower() {
        breezeTime += 0.03;
        const objs = cv.getObjs();
        
        // Interpolar suavemente hacia el ángulo objetivo
        let diff = petalTargetAngle - petalCurrentAngle;
        petalCurrentAngle += diff * 0.08; // Easing suave
        
        // Aplicar a cada pétalo (objetos 1 a 6)
        for (let i = 1; i < objs.length; i++) {
          let petalIdx = i - 1;
          // Ángulo base de apertura (positivo = abrir hacia arriba)
          let openAngle = (petalCurrentAngle * Math.PI) / 180.0;
          // Brisa: oscilación suave con desfase por pétalo
          let breeze = Math.sin(breezeTime + petalIdx * 1.05) * 0.03;
          let breeze2 = Math.sin(breezeTime * 0.7 + petalIdx * 0.8) * 0.015;
          
          objs[i].localRotAngle = openAngle + breeze + breeze2;
        }
        
        if (!autoRotating) {
          cv.paint();
        }
        requestAnimationFrame(animateFlower);
      }
      animateFlower();
      
    }).catch(err => console.error('Error loading flower model:', err));
});