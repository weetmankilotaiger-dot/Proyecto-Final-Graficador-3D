import math
import sys

vertices = []
faces = []

def add_vertex(x, y, z):
    vertices.append((x, y, z))
    return len(vertices)

def add_face(*indices):
    faces.append(list(indices))

def create_box(x, y, z, w, h, d):
    base = len(vertices)
    add_vertex(x - w/2, y - h/2, z - d/2) # 1
    add_vertex(x + w/2, y - h/2, z - d/2) # 2
    add_vertex(x + w/2, y + h/2, z - d/2) # 3
    add_vertex(x - w/2, y + h/2, z - d/2) # 4
    add_vertex(x - w/2, y - h/2, z + d/2) # 5
    add_vertex(x + w/2, y - h/2, z + d/2) # 6
    add_vertex(x + w/2, y + h/2, z + d/2) # 7
    add_vertex(x - w/2, y + h/2, z + d/2) # 8
    
    add_face(base+1, base+4, base+3, base+2)
    add_face(base+5, base+6, base+7, base+8)
    add_face(base+1, base+2, base+6, base+5)
    add_face(base+4, base+8, base+7, base+3)
    add_face(base+1, base+5, base+8, base+4)
    add_face(base+2, base+3, base+7, base+6)

def create_cylinder(x, y, z, r, w, segments=16, axis='z'):
    base = len(vertices)
    for i in range(segments):
        angle = 2 * math.pi * i / segments
        ca = math.cos(angle)
        sa = math.sin(angle)
        if axis == 'x':
            add_vertex(x - w/2, y + r*ca, z + r*sa)
            add_vertex(x + w/2, y + r*ca, z + r*sa)
        elif axis == 'y':
            add_vertex(x + r*ca, y - w/2, z + r*sa)
            add_vertex(x + r*ca, y + w/2, z + r*sa)
        elif axis == 'z':
            add_vertex(x + r*ca, y + r*sa, z - w/2)
            add_vertex(x + r*ca, y + r*sa, z + w/2)
            
    for i in range(segments):
        nxt = (i + 1) % segments
        i1 = base + i * 2 + 1
        i2 = base + i * 2 + 2
        i3 = base + nxt * 2 + 1
        i4 = base + nxt * 2 + 2
        add_face(i1, i2, i4, i3)
    
    cap1 = []
    cap2 = []
    for i in range(segments):
        cap1.append(base + i * 2 + 1)
        cap2.append(base + i * 2 + 2)
    cap1.reverse()
    add_face(*cap1)
    add_face(*cap2)

def create_sloped_box(x, y, z, w_top, w_bottom, h, d_top, d_bottom, offset_z=0):
    base = len(vertices)
    add_vertex(x - w_bottom/2, y - h/2, z - d_bottom/2) # 1
    add_vertex(x + w_bottom/2, y - h/2, z - d_bottom/2) # 2
    add_vertex(x + w_top/2, y + h/2, z - d_top/2 + offset_z) # 3
    add_vertex(x - w_top/2, y + h/2, z - d_top/2 + offset_z) # 4
    add_vertex(x - w_bottom/2, y - h/2, z + d_bottom/2) # 5
    add_vertex(x + w_bottom/2, y - h/2, z + d_bottom/2) # 6
    add_vertex(x + w_top/2, y + h/2, z + d_top/2 + offset_z) # 7
    add_vertex(x - w_top/2, y + h/2, z + d_top/2 + offset_z) # 8
    
    add_face(base+1, base+4, base+3, base+2)
    add_face(base+5, base+6, base+7, base+8)
    add_face(base+1, base+2, base+6, base+5)
    add_face(base+4, base+8, base+7, base+3)
    add_face(base+1, base+5, base+8, base+4)
    add_face(base+2, base+3, base+7, base+6)

# Build Detailed Motorcycle

# 1. Wheels (High poly cylinders)
create_cylinder(0, 0.8, -2.5, 0.8, 0.6, 24, 'x') # Back wheel tire
create_cylinder(0, 0.8, -2.5, 0.6, 0.65, 12, 'x') # Back wheel rim
create_cylinder(0, 0.8, 2.5, 0.8, 0.5, 24, 'x')  # Front wheel tire
create_cylinder(0, 0.8, 2.5, 0.6, 0.55, 12, 'x') # Front wheel rim

# Spokes (Front)
for i in range(5):
    angle = 2 * math.pi * i / 5
    create_box(0, 0.8 + 0.3*math.cos(angle), 2.5 + 0.3*math.sin(angle), 0.45, 0.7, 0.1)
    
# Spokes (Back)
for i in range(6):
    angle = 2 * math.pi * i / 6
    create_box(0, 0.8 + 0.3*math.cos(angle), -2.5 + 0.3*math.sin(angle), 0.55, 0.7, 0.1)

# 2. Main body / Chassis / Frame
create_box(0, 1.4, 0, 0.6, 0.5, 3.5)
create_box(0, 1.1, -1.0, 0.5, 0.3, 2.0)
create_sloped_box(0, 1.2, 1.2, 0.6, 0.4, 1.0, 1.0, 0.6, -0.2)

# 3. Engine Block (Detailed)
create_box(0, 0.7, 0, 0.9, 0.8, 1.6) # Main block
create_cylinder(0.5, 0.7, 0.2, 0.3, 1.0, 12, 'x') # Right cylinder head
create_cylinder(-0.5, 0.7, 0.2, 0.3, 1.0, 12, 'x') # Left cylinder head
create_box(0, 0.4, -0.2, 0.7, 0.4, 1.2) # Oil pan

# 4. Gas Tank (Curved using sloped box)
create_sloped_box(0, 1.9, 0.6, 0.7, 0.8, 0.6, 1.5, 1.8, -0.1)
create_sloped_box(0, 2.2, 0.7, 0.5, 0.7, 0.2, 1.0, 1.5, -0.1) # Tank top

# 5. Seat
create_box(0, 1.8, -0.6, 0.65, 0.2, 1.2)
create_sloped_box(0, 1.8, -1.5, 0.5, 0.65, 0.2, 0.6, 0.6) # Passenger seat

# 6. Tail & Back Fender
create_sloped_box(0, 1.7, -2.1, 0.2, 0.5, 0.3, 0.8, 0.8) # Tail piece
create_box(0, 1.5, -3.2, 0.5, 0.1, 1.0) # License plate holder / mud guard

# 7. Front Fender
create_sloped_box(0, 1.7, 2.3, 0.6, 0.7, 0.1, 1.2, 1.0, 0.2)

# 8. Front Forks & Suspensions
create_cylinder(-0.35, 1.6, 2.3, 0.1, 2.0, 8, 'y') # Left outer fork
create_cylinder(0.35, 1.6, 2.3, 0.1, 2.0, 8, 'y')  # Right outer fork
create_cylinder(-0.35, 1.0, 2.4, 0.06, 1.0, 8, 'y') # Left inner fork
create_cylinder(0.35, 1.0, 2.4, 0.06, 1.0, 8, 'y')  # Right inner fork

# 9. Handlebars & Dash
create_cylinder(0, 2.6, 2.0, 0.06, 1.6, 8, 'x') # Bar
create_box(-0.8, 2.6, 2.0, 0.2, 0.15, 0.15) # Left grip
create_box(0.8, 2.6, 2.0, 0.2, 0.15, 0.15) # Right grip
create_sloped_box(0, 2.4, 1.9, 0.6, 0.5, 0.3, 0.4, 0.3) # Dash display
create_cylinder(0.2, 2.5, 1.8, 0.1, 0.1, 12, 'z') # Speedometer
create_cylinder(-0.2, 2.5, 1.8, 0.1, 0.1, 12, 'z') # Tachometer

# 10. Headlight & Fairing
create_cylinder(0, 2.0, 2.8, 0.3, 0.3, 16, 'z') # Main headlight
create_sloped_box(0, 2.2, 2.6, 0.5, 0.7, 0.6, 0.5, 0.5, 0.2) # Headlight cover/fairing
create_sloped_box(0, 2.8, 2.4, 0.4, 0.5, 0.6, 0.1, 0.3, -0.2) # Windshield

# 11. Exhaust System
create_cylinder(0.6, 0.5, -1.0, 0.12, 1.8, 8, 'z') # Right pipe
create_cylinder(-0.6, 0.5, -1.0, 0.12, 1.8, 8, 'z') # Left pipe
create_cylinder(0.6, 0.6, -2.2, 0.18, 1.0, 10, 'z') # Right muffler
create_cylinder(-0.6, 0.6, -2.2, 0.18, 1.0, 10, 'z') # Left muffler

# 12. Foot pegs
create_cylinder(0.6, 0.8, 0.0, 0.08, 0.4, 8, 'x')
create_cylinder(-0.6, 0.8, 0.0, 0.08, 0.4, 8, 'x')

output_file = "moto.txt"
with open(output_file, "w") as f:
    for i, v in enumerate(vertices):
        f.write(f"{i+1} {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
    f.write("Faces:\n")
    for face in faces:
        f.write(" ".join(str(idx) for idx in face) + ".\n")

print(f"Moto 3D DETAILED model generated: {output_file}")
