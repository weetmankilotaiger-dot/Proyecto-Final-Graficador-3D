import math

vertices = []
faces = []

# Parameters for the Basketball
R = 2.0
num_u = 160 # Longitude segments
num_v = 160 # Latitude segments

def get_seam_dist(nx, ny, nz):
    # 1. Vertical seam (great circle in YZ plane -> x=0)
    d1 = abs(nx)
    
    # 2. Horizontal seam (great circle in XZ plane -> y=0)
    d2 = abs(ny)
    
    # 3. Wavy curves on the sides
    # We want a curve that looks like the classic basketball U-shapes
    # abs(nz) approaches a value that depends on ny
    curve_radius = 0.65
    target_z = curve_radius * math.sqrt(max(0, 1 - ny*ny))
    d3 = abs(abs(nz) - target_z)
    
    # We can also add a slight thickness variation to make it look organic
    return min(d1, d2, d3)

for i in range(num_v + 1):
    phi = math.pi * i / num_v
    for j in range(num_u):
        theta = 2 * math.pi * j / num_u
        
        # Unit sphere coordinates
        nx = math.sin(phi) * math.cos(theta)
        ny = math.cos(phi)
        nz = math.sin(phi) * math.sin(theta)
        
        # Distance to seam
        dist = get_seam_dist(nx, ny, nz)
        
        # Calculate radius
        r_mod = R
        
        seam_width = 0.035
        seam_depth = 0.04
        
        if dist < seam_width:
            # Smooth indentation for the seams
            factor = (math.cos(dist / seam_width * math.pi) + 1) / 2
            r_mod -= seam_depth * factor
        else:
            # Add pebbled texture outside the seam (leather bumps)
            # We use a 3D trigonometric interference pattern (similar to a Gyroid)
            noise = (math.sin(120 * nx) * math.cos(120 * ny) + 
                     math.sin(120 * nz) * math.cos(120 * nx) + 
                     math.sin(120 * ny) * math.cos(120 * nz))
            # Smooth transition from seam to pebbles so it doesn't look harsh
            transition = min(1.0, (dist - seam_width) / 0.02)
            r_mod += 0.005 * noise * transition
            
        x = r_mod * nx
        y = r_mod * ny
        z = r_mod * nz
        
        vertices.append((x, y, z))

# Generate faces (quads and triangles at the poles)
for i in range(num_v):
    for j in range(num_u):
        i_next = i + 1
        j_next = (j + 1) % num_u
        
        v1 = i * num_u + j + 1
        v2 = i * num_u + j_next + 1
        v3 = i_next * num_u + j_next + 1
        v4 = i_next * num_u + j + 1
        
        if i == 0:
            # North pole: v1 and v2 are physically the same point
            faces.append([v1, v3, v4])
        elif i == num_v - 1:
            # South pole: v3 and v4 are physically the same point
            faces.append([v1, v2, v3])
        else:
            # Standard quad
            faces.append([v1, v2, v3, v4])

output_file = "balon.txt"
with open(output_file, "w") as f:
    for i, v in enumerate(vertices):
        # 4 decimal places precision
        f.write(f"{i+1} {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
    
    f.write("Faces:\n")
    for face in faces:
        f.write(" ".join(str(idx) for idx in face) + ".\n")

print(f"Balón de Basketball generado con {len(vertices)} vértices y {len(faces)} caras: {output_file}")
