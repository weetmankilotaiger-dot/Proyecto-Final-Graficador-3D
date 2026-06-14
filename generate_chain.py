"""
Generador de Cadena 3D - Eslabones Detallados tipo Torus Redondeado
Genera archivos .txt compatibles con el formato del motor gráfico WheelEngine.

Cada eslabón es un torus elongado (forma de pista/stadium):
  dos semicírculos conectados por segmentos rectos,
  con sección circular (tube) para darle volumen redondeado.

Los eslabones se alternan en orientación (XY vs XZ) para entrelazarse.
"""
import math

def write_obj(filename, vertices, faces):
    """Escribe un archivo de malla compatible con el motor."""
    with open(filename, 'w') as f:
        for i, v in enumerate(vertices):
            f.write(f"{i+1} {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
        f.write("Faces:\n")
        for face in faces:
            f.write(" ".join(str(idx) for idx in face) + " .\n")

def make_chain_link(
    center_x, center_y, center_z,
    half_length=1.2,    # Mitad de la longitud recta del eslabón
    bend_radius=0.6,    # Radio del semicírculo en los extremos
    tube_radius=0.15,   # Radio del tubo (sección circular)
    path_segments=48,   # Segmentos a lo largo del camino (path)
    tube_segments=12,   # Segmentos alrededor del tubo (sección)
    orientation='xy'    # 'xy' = plano XY, 'xz' = plano XZ
):
    """
    Genera un eslabón de cadena con forma de stadium/torus elongado.
    
    El camino del eslabón es:
    1. Segmento recto inferior: de (-half_length, -bend_radius) a (+half_length, -bend_radius)
    2. Semicírculo derecho: de (+half_length, -bend_radius) a (+half_length, +bend_radius)
    3. Segmento recto superior: de (+half_length, +bend_radius) a (-half_length, +bend_radius)
    4. Semicírculo izquierdo: de (-half_length, +bend_radius) a (-half_length, -bend_radius)
    
    El tubo se construye alrededor de este camino cerrado.
    """
    
    # Generar puntos del camino cerrado (centerline del tubo)
    path_points = []  # (x, y, tangent_x, tangent_y) en coordenadas locales 2D
    
    total_segments = path_segments
    # Distribuir segmentos proporcionalmente
    straight_len = 2 * half_length
    curve_len = math.pi * bend_radius
    total_path_len = 2 * straight_len + 2 * curve_len
    
    n_straight = max(4, int(total_segments * straight_len / total_path_len))
    n_curve = max(6, int(total_segments * curve_len / total_path_len))
    
    # Recalcular para que sea exacto
    actual_total = 2 * n_straight + 2 * n_curve
    
    # Segmento 1: Recto inferior (izq a der)
    for i in range(n_straight):
        t = i / n_straight
        px = -half_length + t * 2 * half_length
        py = -bend_radius
        path_points.append((px, py, 1.0, 0.0))  # tangente: +X
    
    # Segmento 2: Semicírculo derecho
    for i in range(n_curve):
        angle = -math.pi/2 + i * math.pi / n_curve
        px = half_length + bend_radius * math.cos(angle)
        py = bend_radius * math.sin(angle)
        tx = -math.sin(angle)
        ty = math.cos(angle)
        path_points.append((px, py, tx, ty))
    
    # Segmento 3: Recto superior (der a izq)
    for i in range(n_straight):
        t = i / n_straight
        px = half_length - t * 2 * half_length
        py = bend_radius
        path_points.append((px, py, -1.0, 0.0))  # tangente: -X
    
    # Segmento 4: Semicírculo izquierdo
    for i in range(n_curve):
        angle = math.pi/2 + i * math.pi / n_curve
        px = -half_length + bend_radius * math.cos(angle)
        py = bend_radius * math.sin(angle)
        tx = -math.sin(angle)
        ty = math.cos(angle)
        path_points.append((px, py, tx, ty))
    
    # Generar vértices del tubo
    vertices = []
    n_path = len(path_points)
    
    for pi in range(n_path):
        px, py, tx, ty = path_points[pi]
        # Normal perpendicular a la tangente en el plano 2D
        nx, ny = -ty, tx  # Normal perpendicular
        tlen = math.sqrt(tx*tx + ty*ty)
        if tlen > 0:
            tx /= tlen; ty /= tlen
            nx = -ty; ny = tx
        
        for ti in range(tube_segments):
            theta = ti * 2 * math.pi / tube_segments
            
            # Componentes del tubo: nx,ny es "hacia afuera" en el plano, Z es perpendicular al plano
            r_in_plane = tube_radius * math.cos(theta)
            r_out_plane = tube_radius * math.sin(theta)
            
            # Posición del vértice en coordenadas locales 2D + Z
            lx = px + nx * r_in_plane
            ly = py + ny * r_in_plane
            lz = r_out_plane
            
            # Transformar según orientación
            if orientation == 'xy':
                vx = lx + center_x
                vy = ly + center_y
                vz = lz + center_z
            else:  # 'xz'
                vx = lx + center_x
                vy = lz + center_y
                vz = ly + center_z
            
            vertices.append([vx, vy, vz])
    
    # Generar caras (quads entre anillos consecutivos del tubo)
    faces = []
    for pi in range(n_path):
        pi_next = (pi + 1) % n_path
        for ti in range(tube_segments):
            ti_next = (ti + 1) % tube_segments
            
            # Índices (1-based)
            v1 = pi * tube_segments + ti + 1
            v2 = pi * tube_segments + ti_next + 1
            v3 = pi_next * tube_segments + ti_next + 1
            v4 = pi_next * tube_segments + ti + 1
            
            faces.append([v1, v2, v3, v4])
    
    return vertices, faces


def generate_chain(n_links=5, link_spacing=1.35):
    """
    Genera una cadena completa de n_links eslabones.
    Cada eslabón se guarda como un archivo separado para animación independiente.
    """
    
    # Parámetros del eslabón - Detallados para parecerse a la imagen de referencia
    params = dict(
        half_length=1.0,
        bend_radius=0.55,
        tube_radius=0.18,
        path_segments=48,
        tube_segments=10,
    )
    
    files = []
    
    for link_idx in range(n_links):
        # Calcular posición del eslabón
        cx = link_idx * link_spacing
        cy = 0
        cz = 0
        
        # Alternar orientación para entrelazar
        orient = 'xy' if link_idx % 2 == 0 else 'xz'
        
        verts, faces = make_chain_link(cx, cy, cz, orientation=orient, **params)
        
        filename = f"chain_link_{link_idx}.txt"
        write_obj(filename, verts, faces)
        files.append(filename)
        
        print(f"  Eslabón {link_idx}: {len(verts)} vértices, {len(faces)} caras ({orient})")
    
    return files


if __name__ == '__main__':
    print("Generando cadena 3D detallada...")
    files = generate_chain(n_links=5, link_spacing=1.35)
    print(f"Cadena generada: {len(files)} eslabones")
    for f in files:
        print(f"   {f}")
