import { Dimension } from './Dimension.js';
export class CvZbuf {
    constructor(g, canvas) {
        this.maxX0 = -1;
        this.maxY0 = -1;
        this.objs = [];
        this.g = g;
        this.canvas = canvas;
    }
    iX(x) { return Math.round(this.centerX + x - this.imgCenter.x); }
    iY(y) { return Math.round(this.centerY - y + this.imgCenter.y); }
    getObjs() { return this.objs; }
    addObj(obj) { this.objs.push(obj); }
    clearObjs() { this.objs = []; }
    // Backward compatibility
    getObj() { return this.objs.length > 0 ? this.objs[0] : null; }
    setObj(obj) { this.clearObjs(); this.addObj(obj); }
    paint() {
        if (this.objs.length === 0)
            return;
        let dim = new Dimension(this.canvas.width, this.canvas.height);
        this.canvas.width = this.canvas.width;
        this.maxX = dim.width - 1;
        this.maxY = dim.height - 1;
        this.centerX = this.maxX / 2;
        this.centerY = this.maxY / 2;
        if (this.maxX != this.maxX0 || this.maxY != this.maxY0) {
            this.buf = new Array(dim.width);
            for (let i = 0; i < dim.width; i++)
                this.buf[i] = new Array(dim.height);
            this.maxX0 = this.maxX;
            this.maxY0 = this.maxY;
        }
        for (let iy = 0; iy < dim.height; iy++)
            for (let ix = 0; ix < dim.width; ix++)
                this.buf[ix][iy] = 1e30;
        // Create ImageData buffer for pixel manipulation
        let imgData = this.g.createImageData(dim.width, dim.height);
        let pixels = imgData.data;
        // First object sets the image center for the camera view
        this.objs[0].eyeAndScreen(dim);
        this.imgCenter = this.objs[0].getImgCenter();
        // Render loop for each object
        for (let oIdx = 0; oIdx < this.objs.length; oIdx++) {
            let currentObj = this.objs[oIdx];
            currentObj.eyeAndScreen(dim);
            currentObj.planeCoeff();
            let e = currentObj.getE();
            let vScr = currentObj.getVScr();
            let polyList = currentObj.getPolyList();
            if (!polyList)
                continue;
            let baseR = currentObj.baseColorR || 200;
            let baseG = currentObj.baseColorG || 200;
            let baseB = currentObj.baseColorB || 200;
            let nFaces = polyList.length;
            for (let j = 0; j < nFaces; j++) {
                let pol = polyList[j];
                if (pol.getNrs().length < 3 || pol.getH() >= 0)
                    continue;
                pol.triangulate(currentObj);
                let t = pol.getT();
                for (let i = 0; i < t.length; i++) {
                    let tri = t[i];
                    let iA = tri.iA, iB = tri.iB, iC = tri.iC;
                    let a = vScr[iA], b = vScr[iB], c = vScr[iC];
                    let zAi = 1 / e[iA].z, zBi = 1 / e[iB].z, zCi = 1 / e[iC].z;
                    let nA = currentObj.vNormals[iA], nB = currentObj.vNormals[iB], nC = currentObj.vNormals[iC];
                    let cAi = currentObj.colorCode(nA.x, nA.y, nA.z);
                    let cBi = currentObj.colorCode(nB.x, nB.y, nB.z);
                    let cCi = currentObj.colorCode(nC.x, nC.y, nC.z);
                    if (isNaN(cAi))
                        cAi = 255;
                    if (isNaN(cBi))
                        cBi = 255;
                    if (isNaN(cCi))
                        cCi = 255;
                    let u1 = b.x - a.x, v1 = c.x - a.x, u2 = b.y - a.y, v2 = c.y - a.y, cc = u1 * v2 - u2 * v1;
                    if (cc <= 0)
                        continue;
                    let xA = a.x, yA = a.y, xB = b.x, yB = b.y, xC = c.x, yC = c.y, xD = (xA + xB + xC) / 3, yD = (yA + yB + yC) / 3;
                    // Z interpolation
                    let zDi = (zAi + zBi + zCi) / 3, u3 = zBi - zAi, v3 = zCi - zAi, aa = u2 * v3 - u3 * v2, bb = u3 * v1 - u1 * v3, dzdx = -aa / cc, dzdy = -bb / cc;
                    // Color interpolation (Gouraud Shading)
                    let cDi = (cAi + cBi + cCi) / 3, cu3 = cBi - cAi, cv3 = cCi - cAi, caa = u2 * cv3 - cu3 * v2, cbb = cu3 * v1 - u1 * cv3, dcdx = -caa / cc, dcdy = -cbb / cc;
                    let yBottomR = Math.min(yA, Math.min(yB, yC)), yTopR = Math.max(yA, Math.max(yB, yC));
                    let yBottom = Math.ceil(yBottomR), yTop = Math.floor(yTopR);
                    for (let y = yBottom; y <= yTop; y++) {
                        let xI, xJ, xK, xI1, xJ1, xK1, xL, xR;
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
                        let iy = this.iY(y), iXL = this.iX(xL), iXR = this.iX(xR);
                        let zi = 1.01 * zDi + (y - yD) * dzdy + (xL - xD) * dzdx;
                        let ci = cDi + (y - yD) * dcdy + (xL - xD) * dcdx;
                        if (iy >= 0 && iy < dim.height) {
                            for (let ix = iXL; ix <= iXR; ix++) {
                                if (ix >= 0 && ix < dim.width) {
                                    if (zi < this.buf[ix][iy]) {
                                        this.buf[ix][iy] = zi;
                                        let idx = (iy * dim.width + ix) * 4;
                                        let factor = Math.max(0, Math.min(255, ci)) / 255.0;
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
    }
}
