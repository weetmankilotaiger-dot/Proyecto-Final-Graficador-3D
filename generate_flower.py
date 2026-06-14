"""
Generador de Flor 3D Articulada - V3
=====================================
- Petalos de DOBLE CARA (se ven desde ambos lados)
- Vertices ancla para alineacion
- Petalos mas gruesos y redondeados
"""
import math

# Bounding box GLOBAL enorme para que el centro (xwC, ywC, zwC) sea exactamente (0,0,0)
# Así 'shiftToOrigin' no desplaza la flor, y el pivot en (0,0,0) funciona perfecto.
GLOBAL_MIN = [-10.0, -10.0, -10.0]
GLOBAL_MAX = [10.0, 10.0, 10.0]


def write_obj(filename, vertices, faces):
    with open(filename, 'w') as f:
        f.write(f"1 {GLOBAL_MIN[0]:.6f} {GLOBAL_MIN[1]:.6f} {GLOBAL_MIN[2]:.6f}\n")
        f.write(f"2 {GLOBAL_MAX[0]:.6f} {GLOBAL_MAX[1]:.6f} {GLOBAL_MAX[2]:.6f}\n")
        for i, v in enumerate(vertices):
            f.write(f"{i+3} {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
        f.write("Faces:\n")
        for face in faces:
            shifted = [idx + 2 for idx in face]
            f.write(" ".join(str(idx) for idx in shifted) + " .\n")


def make_dome(cx, cy, cz, radius, height, seg_r=14, seg_h=6):
    verts = []
    faces = []
    verts.append([cx, cy, cz])
    
    for ring in range(1, seg_h + 1):
        phi = (ring / seg_h) * (math.pi / 2)
        r = radius * math.cos(phi)
        z = cz + height * math.sin(phi)
        for seg in range(seg_r):
            theta = seg * 2 * math.pi / seg_r
            x = cx + r * math.cos(theta)
            y = cy + r * math.sin(theta)
            verts.append([x, y, z])
    
    verts.append([cx, cy, cz + height])
    
    for seg in range(seg_r):
        next_seg = (seg + 1) % seg_r
        faces.append([1, next_seg + 2, seg + 2])
    
    for ring in range(seg_h - 1):
        base = 1 + ring * seg_r + 1
        for seg in range(seg_r):
            next_seg = (seg + 1) % seg_r
            v1 = base + seg
            v2 = base + next_seg
            v3 = base + seg_r + next_seg
            v4 = base + seg_r + seg
            faces.append([v1, v4, v3, v2])
    
    pole = len(verts)
    last_base = 1 + (seg_h - 1) * seg_r + 1
    for seg in range(seg_r):
        next_seg = (seg + 1) % seg_r
        faces.append([last_base + seg, pole, last_base + next_seg])
    
    return verts, faces


def make_stem(base_z, top_z, radius=0.15, segments=10, height_segments=14):
    verts = []
    faces = []
    
    for hi in range(height_segments + 1):
        t = hi / height_segments
        z = base_z + t * (top_z - base_z)
        x_offset = 0.15 * math.sin(t * math.pi)
        r = radius * (1.0 + 0.15 * (1 - t))
        
        for si in range(segments):
            theta = si * 2 * math.pi / segments
            x = x_offset + r * math.cos(theta)
            y = r * math.sin(theta)
            verts.append([x, y, z])
    
    for hi in range(height_segments):
        for si in range(segments):
            next_si = (si + 1) % segments
            v1 = hi * segments + si + 1
            v2 = hi * segments + next_si + 1
            v3 = (hi + 1) * segments + next_si + 1
            v4 = (hi + 1) * segments + si + 1
            faces.append([v1, v2, v3, v4])
    
    return verts, faces


def make_petal_3d(angle_deg, petal_length=2.5, petal_width=1.2,
                  thickness=0.08, curvature=0.4,
                  seg_length=10, seg_width=6):
    """
    Petalo 3D con volumen (doble cara + bordes).
    Genera cara superior, cara inferior y conecta los bordes.
    """
    verts = []
    faces = []
    
    angle_rad = math.radians(angle_deg)
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)
    
    rows = seg_length + 1
    cols = seg_width + 1
    
    def petal_point(t_len, t_width, z_offset):
        """Calcula un punto del petalo."""
        width_factor = math.sin(t_len * math.pi) if t_len > 0 else 0
        current_width = petal_width * width_factor
        
        z_curve = curvature * t_len
        z_cross = 0.1 * (1 - 4 * t_width * t_width) * t_len
        
        dist = 0.55 + t_len * petal_length
        
        local_along = dist
        local_across = t_width * current_width
        
        x = local_along * cos_a - local_across * sin_a
        y = local_along * sin_a + local_across * cos_a
        z = z_curve + z_cross + z_offset
        
        return [x, y, z]
    
    # Cara superior (offset +thickness/2)
    for li in range(rows):
        t = li / seg_length
        for wi in range(cols):
            tw = wi / seg_width - 0.5
            verts.append(petal_point(t, tw, thickness / 2))
    
    # Cara inferior (offset -thickness/2)
    for li in range(rows):
        t = li / seg_length
        for wi in range(cols):
            tw = wi / seg_width - 0.5
            verts.append(petal_point(t, tw, -thickness / 2))
    
    top_offset = 0
    bot_offset = rows * cols
    
    # Caras superiores (normal hacia arriba)
    for li in range(seg_length):
        for wi in range(seg_width):
            v1 = top_offset + li * cols + wi + 1
            v2 = top_offset + li * cols + wi + 2
            v3 = top_offset + (li + 1) * cols + wi + 2
            v4 = top_offset + (li + 1) * cols + wi + 1
            faces.append([v1, v2, v3, v4])
    
    # Caras inferiores (normal hacia abajo - winding invertido)
    for li in range(seg_length):
        for wi in range(seg_width):
            v1 = bot_offset + li * cols + wi + 1
            v2 = bot_offset + li * cols + wi + 2
            v3 = bot_offset + (li + 1) * cols + wi + 2
            v4 = bot_offset + (li + 1) * cols + wi + 1
            faces.append([v4, v3, v2, v1])  # Reversed winding
    
    # Bordes laterales (conectar superior e inferior en los extremos)
    # Borde izquierdo (wi=0)
    for li in range(seg_length):
        vt1 = top_offset + li * cols + 0 + 1
        vt2 = top_offset + (li + 1) * cols + 0 + 1
        vb1 = bot_offset + li * cols + 0 + 1
        vb2 = bot_offset + (li + 1) * cols + 0 + 1
        faces.append([vb1, vb2, vt2, vt1])
    
    # Borde derecho (wi=seg_width)
    for li in range(seg_length):
        vt1 = top_offset + li * cols + seg_width + 1
        vt2 = top_offset + (li + 1) * cols + seg_width + 1
        vb1 = bot_offset + li * cols + seg_width + 1
        vb2 = bot_offset + (li + 1) * cols + seg_width + 1
        faces.append([vt1, vt2, vb2, vb1])
    
    return verts, faces


def build_flower():
    stem_v, stem_f = make_stem(base_z=-6, top_z=0, radius=0.18, segments=10, height_segments=14)
    dome_v, dome_f = make_dome(0, 0, 0, radius=0.7, height=0.45, seg_r=12, seg_h=5)
    
    all_v = list(stem_v)
    all_f = list(stem_f)
    offset = len(all_v)
    all_v.extend(dome_v)
    for f in dome_f:
        all_f.append([idx + offset for idx in f])
    
    write_obj("flor_centro.txt", all_v, all_f)
    print(f"  Centro: {len(all_v)} verts, {len(all_f)} caras")
    
    num_petals = 6
    for i in range(num_petals):
        angle = i * (360.0 / num_petals)
        pv, pf = make_petal_3d(
            angle_deg=angle,
            petal_length=2.5,
            petal_width=1.3,
            thickness=0.1,
            curvature=0.45,
            seg_length=10,
            seg_width=6
        )
        filename = f"flor_petalo_{i}.txt"
        write_obj(filename, pv, pf)
        print(f"  Petalo {i} ({angle:.0f} deg): {len(pv)} verts, {len(pf)} caras")


if __name__ == '__main__':
    print("Generando flor 3D v3 (doble cara)...")
    build_flower()
    print("Listo!")
