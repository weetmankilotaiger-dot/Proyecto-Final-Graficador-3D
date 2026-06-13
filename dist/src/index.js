import { Obj3D } from './Obj3D.js';
import { CvZbuf } from './CvZbuf.js';
var canvas;
var graphics;
canvas = document.getElementById('circlechart');
graphics = canvas.getContext('2d');
var cv;
var obj;
function leerArchivo(e) {
    var archivo = e.target.files[0];
    if (!archivo) {
        return;
    }
    // Mostrar nombre del archivo
    document.getElementById('file-name-display').innerText = archivo.name;
    var lector = new FileReader();
    lector.onload = function (e) {
        var contenido = e.target.result;
        // Mostrar en visor crudo
        var rawTextEl = document.getElementById('raw-file-content');
        if (rawTextEl)
            rawTextEl.value = contenido;
        obj = new Obj3D();
        if (obj.read(contenido)) {
            cv = new CvZbuf(graphics, canvas);
            cv.setObj(obj);
            cv.paint();
            // Actualizar estadisticas de Vertices y Caras (Triangulos)
            var verts = obj.w.length - 1; // El vertice 0 no se usa
            var tris = obj.getPolyList().length;
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
function vp(dTheta, dPhi, fRho) {
    if (cv && cv.getObjs().length > 0) {
        cv.getObjs().forEach(function (o) {
            o.vp(cv, dTheta, dPhi, fRho);
        });
    }
}
// Eventos
document.getElementById('file-input').addEventListener('change', leerArchivo, false);
var Pix, Piy;
var Pfx, Pfy;
var flag = false;
var autoRotating = false;
var animationFrameId;
function toggleAutoRotate() {
    if (!obj) {
        alert('Primero carga un modelo 3D.');
        return;
    }
    autoRotating = !autoRotating;
    var btn = document.getElementById('btn-auto-rotate');
    if (autoRotating) {
        btn.innerHTML = 'II Detener';
        btn.classList.add('active-red');
        rotateLoop();
    }
    else {
        btn.innerHTML = '▶ Animar';
        btn.classList.remove('active-red');
        cancelAnimationFrame(animationFrameId);
    }
}
function rotateLoop() {
    if (!autoRotating)
        return;
    var speedVal = parseFloat(document.getElementById('input-velocidad').value) || 45;
    // Convert 0-180 scale to a small rotation angle per frame
    var dTheta = speedVal * 0.0005;
    vp(dTheta, 0, 1);
    animationFrameId = requestAnimationFrame(rotateLoop);
}
document.getElementById('btn-auto-rotate').addEventListener('click', toggleAutoRotate, false);
// Manipulación 360 (Ratón)
function handleMouse(evento) {
    Pix = evento.offsetX;
    Piy = evento.offsetY;
    flag = true;
}
function makeVizualization(evento) {
    if (flag && obj) {
        Pfx = evento.offsetX;
        Pfy = evento.offsetY;
        var difX = Pfx - Pix;
        var difY = Pfy - Piy;
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
    var inputs = ['velocidad', 'luzX', 'luzY', 'luzZ', 'eyeZ', 'fov', 'apertura'];
    inputs.forEach(function (id) {
        var el = document.getElementById("input-".concat(id));
        var valEl = document.getElementById("val-".concat(id));
        if (el && valEl) {
            el.addEventListener('input', function (e) {
                var val = e.target.value;
                if (id === 'velocidad') {
                    valEl.innerText = "".concat(val, ".0\u00B0/s");
                    document.getElementById('bottom-stat-vel').innerText = "".concat(val, "\u00B0/s");
                }
                else if (id === 'eyeZ') {
                    valEl.innerText = parseFloat(val).toFixed(1);
                    if (obj) {
                        // Map the generic slider (1 to 20) to actual eye distance based on obj's bounds
                        // rhoMin is the closest distance. Default rho is 3 * rhoMin.
                        obj.rho = obj.rhoMin * parseFloat(val);
                        if (cv)
                            cv.paint();
                    }
                }
                else if (id === 'fov') {
                    valEl.innerText = "".concat(val, "\u00B0");
                    if (obj) {
                        // Default FOV slider is 38. We map 38 to a multiplier of 1.0.
                        obj.zoomMultiplier = 38.0 / parseFloat(val);
                        if (cv)
                            cv.paint();
                    }
                }
                else if (id === 'apertura') {
                    valEl.innerText = "".concat(val, "\u00B0");
                    if (cv && cv.getObjs().length > 1) {
                        // La pieza móvil es el índice 1
                        var movil = cv.getObjs()[1];
                        movil.localRotZ = -(parseFloat(val) * Math.PI) / 180.0;
                        cv.paint();
                    }
                }
                else {
                    valEl.innerText = parseFloat(val).toFixed(2);
                    updateLightingToObj();
                }
            });
        }
    });
}
setupSliders();
function updateLightingFromObj() {
    if (!obj)
        return;
    document.getElementById('input-luzX').value = obj.sunX.toFixed(2);
    document.getElementById('val-luzX').innerText = obj.sunX.toFixed(2);
    document.getElementById('input-luzY').value = obj.sunY.toFixed(2);
    document.getElementById('val-luzY').innerText = obj.sunY.toFixed(2);
    document.getElementById('input-luzZ').value = obj.sunZ.toFixed(2);
    document.getElementById('val-luzZ').innerText = obj.sunZ.toFixed(2);
    // Reset camera sliders to default when a new object is loaded
    var eyeZInput = document.getElementById('input-eyeZ');
    var eyeZVal = document.getElementById('val-eyeZ');
    if (eyeZInput && eyeZVal) {
        eyeZInput.value = '3.0';
        eyeZVal.innerText = '3.0';
        obj.rho = obj.rhoMin * 3.0;
    }
    var fovInput = document.getElementById('input-fov');
    var fovVal = document.getElementById('val-fov');
    if (fovInput && fovVal) {
        fovInput.value = '38';
        fovVal.innerText = '38°';
        obj.zoomMultiplier = 1.0;
    }
}
// Actualizar iluminación en el objeto
function updateLightingToObj() {
    if (!obj)
        return;
    var lx = parseFloat(document.getElementById('input-luzX').value);
    var ly = parseFloat(document.getElementById('input-luzY').value);
    var lz = parseFloat(document.getElementById('input-luzZ').value);
    if (cv && cv.getObjs().length > 0) {
        cv.getObjs().forEach(function (o) {
            o.sunX = lx;
            o.sunY = ly;
            o.sunZ = lz;
        });
        cv.paint();
    }
}
// Resize handling básico
function resizeCanvas() {
    var container = document.getElementById('canvas-container');
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
    var swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(function (swatch) {
        swatch.addEventListener('click', function (e) {
            swatches.forEach(function (s) { return s.classList.remove('active'); });
            var target = e.target;
            target.classList.add('active');
            var bg = window.getComputedStyle(target).backgroundColor;
            var match = bg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match && obj) {
                obj.baseColorR = parseInt(match[1]);
                obj.baseColorG = parseInt(match[2]);
                obj.baseColorB = parseInt(match[3]);
                if (cv)
                    cv.paint();
            }
        });
    });
}
setupColorSwatches();
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);
// D-Pad Rotation Handling
var manualRotationInterval;
function startManualRotation(dTheta, dPhi, fRho) {
    if (fRho === void 0) { fRho = 1; }
    if (!obj)
        return;
    // Rotate/zoom once immediately
    vp(dTheta, dPhi, fRho);
    // Then start interval for continuous action
    clearInterval(manualRotationInterval);
    manualRotationInterval = window.setInterval(function () {
        vp(dTheta, dPhi, fRho);
    }, 30); // 30ms for smooth ~30fps
}
function stopManualRotation() {
    clearInterval(manualRotationInterval);
}
function setupDPad() {
    var btnUp = document.getElementById('btn-rot-up');
    var btnDown = document.getElementById('btn-rot-down');
    var btnLeft = document.getElementById('btn-rot-left');
    var btnRight = document.getElementById('btn-rot-right');
    var btnZoomIn = document.getElementById('btn-zoom-in');
    var btnZoomOut = document.getElementById('btn-zoom-out');
    var addHoldEvents = function (btn, dTheta, dPhi, fRho) {
        if (fRho === void 0) { fRho = 1; }
        if (!btn)
            return;
        btn.addEventListener('mousedown', function () { return startManualRotation(dTheta, dPhi, fRho); });
        btn.addEventListener('mouseup', stopManualRotation);
        btn.addEventListener('mouseleave', stopManualRotation);
        // Touch support for mobile
        btn.addEventListener('touchstart', function (e) { e.preventDefault(); startManualRotation(dTheta, dPhi, fRho); });
        btn.addEventListener('touchend', function (e) { e.preventDefault(); stopManualRotation(); });
        btn.addEventListener('touchcancel', function (e) { e.preventDefault(); stopManualRotation(); });
    };
    var rotSpeed = 0.05; // Base rotation speed for D-pad
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
canvas.addEventListener('wheel', function (e) {
    e.preventDefault(); // Stop page from scrolling
    if (!obj)
        return;
    if (e.deltaY < 0) {
        vp(0, 0, 0.9); // Zoom in
    }
    else {
        vp(0, 0, 1.1); // Zoom out
    }
});
var btnLoadPinza = document.getElementById('btn-load-pinza');
if (btnLoadPinza) {
    btnLoadPinza.addEventListener('click', function () {
        // Stop auto rotation if it was running
        if (autoRotating)
            toggleAutoRotate();
        cv.clearObjs();
        Promise.all([
            fetch('pinza_base.txt').then(function (r) { return r.text(); }),
            fetch('pinza_movil.txt').then(function (r) { return r.text(); })
        ]).then(function (_a) {
            var baseData = _a[0], movilData = _a[1];
            var baseObj = new Obj3D();
            if (baseObj.read(baseData)) {
                baseObj.baseColorR = 100;
                baseObj.baseColorG = 150;
                baseObj.baseColorB = 200;
                cv.addObj(baseObj);
            }
            var movilObj = new Obj3D();
            if (movilObj.read(movilData)) {
                movilObj.baseColorR = 200;
                movilObj.baseColorG = 100;
                movilObj.baseColorB = 100;
                // Asignamos el pivote de la pieza movil
                movilObj.pivotX = 0;
                movilObj.pivotY = -0.5;
                movilObj.pivotZ = 0.2;
                cv.addObj(movilObj);
            }
            // We set 'obj' to baseObj so global UI logic (like lighting) still binds to it.
            // But both objects share the camera perspective implicitly since they are drawn in the same context.
            // Wait, updateLightingToObj() only updates 'obj'. We need to make sure ALL objects get the light!
            obj = baseObj;
            updateLightingToObj();
            cv.getObjs().forEach(function (o) {
                o.sunX = obj.sunX;
                o.sunY = obj.sunY;
                o.sunZ = obj.sunZ;
                o.ambientLight = obj.ambientLight;
            });
            document.getElementById('file-name-display').innerText = "Pinza Articulada";
            document.getElementById('raw-file-content').value = "Multi-part object loaded.\n- pinza_base.txt\n- pinza_movil.txt";
            cv.paint();
        }).catch(function (err) { return console.error('Error loading pinzas:', err); });
    });
}
// Cargar modelo por defecto al iniciar
window.addEventListener('load', function () {
    fetch('balon.txt')
        .then(function (response) { return response.text(); })
        .then(function (contenido) {
        var fileNameDisplay = document.getElementById('file-name-display');
        if (fileNameDisplay)
            fileNameDisplay.innerText = 'balon.txt';
        var rawTextEl = document.getElementById('raw-file-content');
        if (rawTextEl)
            rawTextEl.value = contenido;
        obj = new Obj3D();
        if (obj.read(contenido)) {
            // Establecer color naranja oficial para el balon
            obj.baseColorR = 255;
            obj.baseColorG = 100;
            obj.baseColorB = 0;
            cv = new CvZbuf(graphics, canvas);
            cv.setObj(obj);
            cv.paint();
            var verts = obj.w.length - 1;
            var tris = obj.getPolyList().length;
            var statVerts = document.getElementById('stat-verts');
            if (statVerts)
                statVerts.innerText = verts.toString();
            var bottomStatVerts = document.getElementById('bottom-stat-verts');
            if (bottomStatVerts)
                bottomStatVerts.innerText = verts.toString();
            var statTris = document.getElementById('stat-tris');
            if (statTris)
                statTris.innerText = tris.toString();
            var bottomStatTris = document.getElementById('bottom-stat-tris');
            if (bottomStatTris)
                bottomStatTris.innerText = tris.toString();
            updateLightingFromObj();
            // Auto-start rotation
            if (!autoRotating) {
                toggleAutoRotate();
            }
        }
    })
        .catch(function (err) { return console.error('Error loading default model:', err); });
});
