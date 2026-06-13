import { Dimension } from './Dimension.js';
var CvZbuf = /** @class */ (function () {
    function CvZbuf(g, canvas) {
        this.maxX0 = -1;
        this.maxY0 = -1;
        this.objs = [];
        this.g = g;
        this.canvas = canvas;
    }
    CvZbuf.prototype.iX = function (x) { return Math.round(this.centerX + x - this.imgCenter.x); };
    CvZbuf.prototype.iY = function (y) { return Math.round(this.centerY - y + this.imgCenter.y); };
    CvZbuf.prototype.getObjs = function () { return this.objs; };
    CvZbuf.prototype.addObj = function (obj) { this.objs.push(obj); };
    CvZbuf.prototype.clearObjs = function () { this.objs = []; };
    // Backward compatibility
    CvZbuf.prototype.getObj = function () { return this.objs.length > 0 ? this.objs[0] : null; };
    CvZbuf.prototype.setObj = function (obj) { this.clearObjs(); this.addObj(obj); };
    CvZbuf.prototype.paint = function () {
        if (this.objs.length === 0)
            return;
        var dim = new Dimension(this.canvas.width, this.canvas.height);
        this.canvas.width = this.canvas.width;
        this.maxX = dim.width - 1;
        this.maxY = dim.height - 1;
        this.centerX = this.maxX / 2;
        this.centerY = this.maxY / 2;
        if (this.maxX != this.maxX0 || this.maxY != this.maxY0) {
            this.buf = new Array(dim.width);
            for (var i = 0; i < dim.width; i++)
                this.buf[i] = new Array(dim.height);
            this.maxX0 = this.maxX;
            this.maxY0 = this.maxY;
        }
        for (var iy = 0; iy < dim.height; iy++)
            for (var ix = 0; ix < dim.width; ix++)
                this.buf[ix][iy] = 1e30;
        // Create ImageData buffer for pixel manipulation
        var imgData = this.g.createImageData(dim.width, dim.height);
        var pixels = imgData.data;
        // First object sets the image center for the camera view
        this.objs[0].eyeAndScreen(dim);
        this.imgCenter = this.objs[0].getImgCenter();
        // Render loop for each object
        for (var oIdx = 0; oIdx < this.objs.length; oIdx++) {
            var currentObj = this.objs[oIdx];
            currentObj.eyeAndScreen(dim);
            currentObj.planeCoeff();
            var e = currentObj.getE();
            var vScr = currentObj.getVScr();
            var polyList = currentObj.getPolyList();
            if (!polyList)
                continue;
            var baseR = currentObj.baseColorR || 200;
            var baseG = currentObj.baseColorG || 200;
            var baseB = currentObj.baseColorB || 200;
            var nFaces = polyList.length;
            for (var j = 0; j < nFaces; j++) {
                var pol = polyList[j];
                if (pol.getNrs().length < 3 || pol.getH() >= 0)
                    continue;
                pol.triangulate(currentObj);
                var t = pol.getT();
                for (var i = 0; i < t.length; i++) {
                    var tri = t[i];
                    var iA = tri.iA, iB = tri.iB, iC = tri.iC;
                    var a = vScr[iA], b = vScr[iB], c = vScr[iC];
                    var zAi = 1 / e[iA].z, zBi = 1 / e[iB].z, zCi = 1 / e[iC].z;
                    var nA = currentObj.vNormals[iA], nB = currentObj.vNormals[iB], nC = currentObj.vNormals[iC];
                    var cAi = currentObj.colorCode(nA.x, nA.y, nA.z);
                    var cBi = currentObj.colorCode(nB.x, nB.y, nB.z);
                    var cCi = currentObj.colorCode(nC.x, nC.y, nC.z);
                    if (isNaN(cAi))
                        cAi = 255;
                    if (isNaN(cBi))
                        cBi = 255;
                    if (isNaN(cCi))
                        cCi = 255;
                    var u1 = b.x - a.x, v1 = c.x - a.x, u2 = b.y - a.y, v2 = c.y - a.y, cc = u1 * v2 - u2 * v1;
                    if (cc <= 0)
                        continue;
                    var xA = a.x, yA = a.y, xB = b.x, yB = b.y, xC = c.x, yC = c.y, xD = (xA + xB + xC) / 3, yD = (yA + yB + yC) / 3;
                    // Z interpolation
                    var zDi = (zAi + zBi + zCi) / 3, u3 = zBi - zAi, v3 = zCi - zAi, aa = u2 * v3 - u3 * v2, bb = u3 * v1 - u1 * v3, dzdx = -aa / cc, dzdy = -bb / cc;
                    // Color interpolation (Gouraud Shading)
                    var cDi = (cAi + cBi + cCi) / 3, cu3 = cBi - cAi, cv3 = cCi - cAi, caa = u2 * cv3 - cu3 * v2, cbb = cu3 * v1 - u1 * cv3, dcdx = -caa / cc, dcdy = -cbb / cc;
                    var yBottomR = Math.min(yA, Math.min(yB, yC)), yTopR = Math.max(yA, Math.max(yB, yC));
                    var yBottom = Math.ceil(yBottomR), yTop = Math.floor(yTopR);
                    for (var y = yBottom; y <= yTop; y++) {
                        var xI = void 0, xJ = void 0, xK = void 0, xI1 = void 0, xJ1 = void 0, xK1 = void 0, xL = void 0, xR = void 0;
                        xI = xJ = xK = 1e30;
                        xI1 = xJ1 = xK1 = -1e30;
                        if ((y - yB) * (y - yC) <= 0 && yB != yC)
                            xI = xI1 = xC + (y - yC) / (yB - yC) * (xB - xC);
                        if ((y - yC) * (y - yA) <= 0 && yC != yA)
                            xJ = xJ1 = xA + (y - yA) / (yC - yA) * (xC - xA);
                        if ((y - yA) * (y - yB) <= 0 && yA != yB)
                            xK = xK1 = xB + (y - yB) / (yA - yB) * (xA - xB);
                        xL = Math.min(xI, Math.min(xJ, xK));
                        xR = Math.max(xI1, Math.max(xJ1, xK1));
                        var iy = this.iY(y), iXL = this.iX(xL), iXR = this.iX(xR);
                        var zi = 1.01 * zDi + (y - yD) * dzdy + (xL - xD) * dzdx;
                        var ci = cDi + (y - yD) * dcdy + (xL - xD) * dcdx;
                        if (iy >= 0 && iy < dim.height) {
                            for (var ix = iXL; ix <= iXR; ix++) {
                                if (ix >= 0 && ix < dim.width) {
                                    if (zi < this.buf[ix][iy]) {
                                        this.buf[ix][iy] = zi;
                                        var idx = (iy * dim.width + ix) * 4;
                                        var factor = Math.max(0, Math.min(255, ci)) / 255.0;
                                        pixels[idx] = Math.round(baseR * factor);
                                        pixels[idx + 1] = Math.round(baseG * factor);
                                        pixels[idx + 2] = Math.round(baseB * factor);
                                        pixels[idx + 3] = 255;
                                    }
                                }
                                zi += dzdx;
                                ci += dcdx;
                            }
                        }
                    }
                }
            }
        }
        this.g.putImageData(imgData, 0, 0);
    };
    return CvZbuf;
}());
export { CvZbuf };
