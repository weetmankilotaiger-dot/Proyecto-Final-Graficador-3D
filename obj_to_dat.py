import sys

def convert_obj_to_dat(obj_filepath, output_filepath):
    vertices = []
    faces = []

    with open(obj_filepath, 'r') as f:
        for line in f:
            if line.startswith('v '):
                # Es un vertice: v x y z
                parts = line.strip().split()
                if len(parts) >= 4:
                    vertices.append((float(parts[1]), float(parts[2]), float(parts[3])))
            elif line.startswith('f '):
                # Es una cara: f v1/vt1/vn1 v2/vt2/vn2 ...
                parts = line.strip().split()[1:]
                face_indices = []
                for p in parts:
                    # Toma solo el primer indice (v) antes de la barra
                    v_idx = p.split('/')[0]
                    face_indices.append(int(v_idx))
                faces.append(face_indices)

    with open(output_filepath, 'w') as f:
        # Escribir vertices
        for i, v in enumerate(vertices):
            # El motor lee: id x y z
            f.write(f"{i+1} {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
        
        f.write("Faces:\n")
        
        # Escribir caras
        for face in faces:
            # El motor lee: v1 v2 v3 v4.
            face_str = " ".join(str(idx) for idx in face)
            f.write(f"{face_str}.\n")

    print(f"Conversion exitosa: {len(vertices)} vertices y {len(faces)} caras exportadas a {output_filepath}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Uso: python obj_to_dat.py <input.obj> <output.txt>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    convert_obj_to_dat(input_file, output_file)
