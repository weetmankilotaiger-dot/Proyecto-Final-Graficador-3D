import math

vertices = []
faces = []

# Parameters for a highly detailed "Twisted Gear Torus"
R = 2.5  # Major radius
r = 0.8  # Minor radius
num_u = 200  # Segments around the major circle
num_v = 80   # Segments around the minor circle (tube)

for i in range(num_u):
    u = 2 * math.pi * i / num_u
    for j in range(num_v):
        v = 2 * math.pi * j / num_v
        
        # Add high-detail geometry patterns
        # 1. Teeth along the main ring
        teeth = 0.15 * math.cos(15 * u)
        
        # 2. Ridges around the tube
        ridges = 0.1 * math.sin(8 * v)
        
        # 3. Micro bumps for extra specular detail
        micro = 0.02 * math.sin(40 * u) * math.cos(20 * v)
        
        r_mod = r + teeth + ridges + micro
        
        # Twist the tube geometry as it revolves
        v_twisted = v + 2 * u 
        
        x = (R + r_mod * math.cos(v_twisted)) * math.cos(u)
        y = (R + r_mod * math.cos(v_twisted)) * math.sin(u)
        z = r_mod * math.sin(v_twisted)
        
        vertices.append((x, y, z))

# Generate the faces (quads) linking the vertices
for i in range(num_u):
    for j in range(num_v):
        # Calculate indices (1-based for the engine)
        i_next = (i + 1) % num_u
        j_next = (j + 1) % num_v
        
        v1 = i * num_v + j + 1
        v2 = i * num_v + j_next + 1
        v3 = i_next * num_v + j_next + 1
        v4 = i_next * num_v + j + 1
        
        faces.append([v1, v2, v3, v4])

output_file = "torus_detallado.txt"
with open(output_file, "w") as f:
    for i, v in enumerate(vertices):
        # Using 4 decimal places for precision
        f.write(f"{i+1} {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
    
    f.write("Faces:\n")
    for face in faces:
        f.write(" ".join(str(idx) for idx in face) + ".\n")

print(f"Modelo ultra detallado generado con {len(vertices)} vértices y {len(faces)} caras: {output_file}")
