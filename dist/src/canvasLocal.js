export class CanvasLocal {
    constructor(g, canvas) {
        this.graphics = g;
        this.rWidth = 6;
        this.rHeight = 4;
        this.maxX = canvas.width - 1;
        this.maxY = canvas.height - 1;
        this.pixelSize = Math.max(this.rWidth / this.maxX, this.rHeight / this.maxY);
        this.centerX = this.maxX / 2;
        this.centerY = this.maxY / 2;
    }
    /**
     * Dibuja una línea recta entre dos puntos dados en el canvas.
     * @param x1 Coordenada X del punto de inicio
     * @param y1 Coordenada Y del punto de inicio
     * @param x2 Coordenada X del punto final
     * @param y2 Coordenada Y del punto final
     */
    drawLine(x1, y1, x2, y2) {
        this.graphics.beginPath();
        this.graphics.moveTo(x1, y1);
        this.graphics.lineTo(x2, y2);
        this.graphics.closePath();
        this.graphics.stroke();
    }
    /**
     * Dibuja un polígono trazando líneas entre un arreglo secuencial de puntos.
     * Conecta el último punto de vuelta con el primero para cerrar la figura.
     * @param points Arreglo de coordenadas {x, y} de cada vértice del polígono.
     */
    drawPolygon(points) {
        for (let i = 0; i < points.length; i++) {
            let p1 = points[i];
            let p2 = points[(i + 1) % points.length]; // Conecta el último con el primero
            this.drawLine(p1.x, p1.y, p2.x, p2.y);
        }
    }
    /**
     * Genera y dibuja una sucesión de hexágonos anidados en el canvas.
     * El cálculo de cada nuevo polígono se hace encontrando el punto medio
     * de los lados del polígono anterior y uniendo esos puntos medios.
     */
    paint() {
        let side = Math.min(this.maxX, this.maxY) * 0.9;
        let radius = side / 2; // Radio de la circunferencia que circunscribe al pentágono
        let sides = 5; // Número de lados (Pentágono)
        // Generar los vértices iniciales del hexágono regular
        let points = [];
        for (let i = 0; i < sides; i++) {
            // Ángulo en radianes (Math.PI * 2 / lados para no tener rotación inicial)
            // Modificamos a (i * 2 * PI / sides) para mantener el borde superior/inferior horizontal congruente con la imagen
            let angle = (i * 2 * Math.PI / sides);
            points.push({
                x: this.centerX + radius * Math.cos(angle),
                y: this.centerY + radius * Math.sin(angle)
            });
        }
        // Dibujar las figuras anidadas en profundidad
        for (let i = 0; i < 15; i++) {
            // Alternar colores entre rojo y negro para cada iteración visible
            if (i % 2 === 0) {
                this.graphics.strokeStyle = 'red';
            }
            else {
                this.graphics.strokeStyle = 'black';
            }
            // Dibujar el polígono actual
            this.drawPolygon(points);
            // Calcular los nuevos vértices conectando los puntos medios del polígono actual
            let nextPoints = [];
            for (let j = 0; j < sides; j++) {
                let p1 = points[j];
                let p2 = points[(j + 1) % sides];
                // Punto medio (puede cambiarse el divisor para crear efectos de rotación asimétricos)
                nextPoints.push({
                    x: (p1.x + p2.x) / 2,
                    y: (p1.y + p2.y) / 2
                });
            }
            points = nextPoints; // Actualizar los vértices para la siguiente iteración
        }
    }
}
