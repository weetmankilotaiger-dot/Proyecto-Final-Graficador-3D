import sys

def create_box(name, cx, cy, cz, w, h, d):
    v = [
        [cx - w/2, cy - h/2, cz - d/2],
        [cx + w/2, cy - h/2, cz - d/2],
        [cx + w/2, cy + h/2, cz - d/2],
        [cx - w/2, cy + h/2, cz - d/2],
        [cx - w/2, cy - h/2, cz + d/2],
        [cx + w/2, cy - h/2, cz + d/2],
        [cx + w/2, cy + h/2, cz + d/2],
        [cx - w/2, cy + h/2, cz + d/2],
    ]
    f = [
        [1, 2, 3, 4], # Front
        [5, 8, 7, 6], # Back
        [1, 5, 6, 2], # Bottom
        [4, 3, 7, 8], # Top
        [1, 4, 8, 5], # Left
        [2, 6, 7, 3], # Right
    ]
    return v, f

def write_obj(filename, parts):
    vertices = []
    faces = []
    for v, f in parts:
        offset = len(vertices)
        vertices.extend(v)
        for face in f:
            faces.append([idx + offset for idx in face])
            
    with open(filename, 'w') as f:
        # Escribir vertices en formato "id x y z"
        for i, v in enumerate(vertices):
            f.write(f"{i+1} {v[0]:.2f} {v[1]:.2f} {v[2]:.2f}\n")
        
        f.write("Faces:\n")
        
        # Escribir caras en formato "v1 v2 v3 v4 ."
        for face in faces:
            f.write(" ".join(str(idx) for idx in face) + " .\n")

# El pivote de rotacion estara en (0, -0.5, 0)
# Pinza Base (Mango Izquierdo + Mandibula Derecha + Eje central)
base_parts = []
base_parts.append(create_box("mango_izq", -0.8, -3, 0, 0.6, 4, 0.6))
base_parts.append(create_box("eje_izq", 0, -0.5, -0.15, 1.8, 1.2, 0.3))
base_parts.append(create_box("mandibula_der", 0.5, 1.5, 0, 0.5, 2.5, 0.5))
base_parts.append(create_box("punta_der", 0.3, 3.2, 0, 0.2, 1.0, 0.5))

write_obj("pinza_base.txt", base_parts)

# Pinza Movil (Mango Derecho + Mandibula Izquierda + Eje central)
movil_parts = []
movil_parts.append(create_box("mango_der", 0.8, -3, 0.2, 0.6, 4, 0.6))
movil_parts.append(create_box("eje_der", 0, -0.5, 0.2, 1.8, 1.2, 0.4))
movil_parts.append(create_box("mandibula_izq", -0.5, 1.5, 0.2, 0.5, 2.5, 0.5))
movil_parts.append(create_box("punta_izq", -0.3, 3.2, 0.2, 0.2, 1.0, 0.5))

write_obj("pinza_movil.txt", movil_parts)
print("Archivos pinza_base.txt y pinza_movil.txt generados exitosamente.")
