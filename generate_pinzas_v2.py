import math

def write_obj(filename, vertices, faces):
    with open(filename, 'w') as f:
        # Formato exacto que espera Obj3D.ts
        for i, v in enumerate(vertices):
            f.write(f"{i+1} {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
        f.write("Faces:\n")
        for face in faces:
            f.write(" ".join(str(idx) for idx in face) + " .\n")

def make_cylinder(radius, z_min, z_max, segments=16):
    vertices = []
    faces = []
    
    def add_poly(pts):
        idxs = []
        for p in pts:
            vertices.append(p)
            idxs.append(len(vertices))
        faces.append(idxs)
        
    for i in range(segments):
        a1 = i * 2 * math.pi / segments
        a2 = (i + 1) * 2 * math.pi / segments
        
        x1, y1 = radius * math.cos(a1), radius * math.sin(a1)
        x2, y2 = radius * math.cos(a2), radius * math.sin(a2)
        
        add_poly([[0,0,z_min], [x2,y2,z_min], [x1,y1,z_min]])
        add_poly([[0,0,z_max], [x1,y1,z_max], [x2,y2,z_max]])
        add_poly([[x1,y1,z_min], [x2,y2,z_min], [x2,y2,z_max], [x1,y1,z_max]])
        
    return vertices, faces

def merge_parts(parts):
    all_v = []
    all_f = []
    for v_list, f_list in parts:
        offset = len(all_v)
        all_v.extend(v_list)
        for f in f_list:
            all_f.append([idx + offset for idx in f])
    return all_v, all_f

def build_jaw(is_base):
    # Base = Right Jaw (X > 0)
    # Movil = Left Jaw (X < 0)
    z_min = -0.5 if is_base else 0.0
    z_max = 0.0 if is_base else 0.5
    sign = 1 if is_base else -1
    
    parts = []
    
    # 1. Main Pivot Cylinder
    parts.append(make_cylinder(1.8, z_min, z_max, 24))
    
    # 2. Screw hole (if base, add a small cylinder sticking out for the screw)
    if is_base:
        parts.append(make_cylinder(0.6, z_max, z_max + 0.6, 12)) # Screw head
    
    # 3. Jaw body
    v = []
    f = []
    def add_poly(pts):
        idxs = []
        for p in pts:
            v.append(p)
            idxs.append(len(v))
        f.append(idxs)
        
    p1 = [0.0, 0.0, z_min]
    p2 = [sign * 1.8, 0.0, z_min]
    p3 = [sign * 1.8, 0.0, z_max]
    p4 = [0.0, 0.0, z_max]
    
    p9 =  [0.0, 3.5, z_min]
    p10 = [sign * 1.8, 3.5, z_min]
    p11 = [sign * 1.8, 3.5, z_max]
    p12 = [0.0, 3.5, z_max]
    
    p5 = [0.0, 7.5, z_min]
    p6 = [sign * 0.4, 7.5, z_min]
    p7 = [sign * 0.4, 7.5, z_max]
    p8 = [0.0, 7.5, z_max]

    # Lower Jaw Block
    if is_base: # Right side
        add_poly([p1, p2, p10, p9]) # Back
        add_poly([p4, p12, p11, p3]) # Front
        add_poly([p1, p9, p12, p4]) # Inner
        add_poly([p2, p3, p11, p10]) # Outer
    else: # Left side (reverse winding to be safe, though engine might not do backface culling strictly)
        add_poly([p1, p9, p10, p2]) 
        add_poly([p4, p3, p11, p12]) 
        add_poly([p1, p4, p12, p9]) 
        add_poly([p2, p10, p11, p3]) 

    # Upper Jaw Block
    if is_base:
        add_poly([p9, p10, p6, p5])
        add_poly([p12, p8, p7, p11])
        add_poly([p9, p5, p8, p12])
        add_poly([p10, p11, p7, p6])
        add_poly([p5, p6, p7, p8]) # Tip
    else:
        add_poly([p9, p5, p6, p10])
        add_poly([p12, p11, p7, p8])
        add_poly([p9, p12, p8, p5])
        add_poly([p10, p6, p7, p11])
        add_poly([p5, p8, p7, p6])
        
    # Teeth (Dientes) - small ridges on the inner face
    for i in range(5):
        y_tooth = 4.0 + i * 0.5
        t1 = [0.0, y_tooth, z_min]
        t2 = [sign * -0.2, y_tooth + 0.2, z_min]
        t3 = [0.0, y_tooth + 0.4, z_min]
        t4 = [0.0, y_tooth, z_max]
        t5 = [sign * -0.2, y_tooth + 0.2, z_max]
        t6 = [0.0, y_tooth + 0.4, z_max]
        if is_base:
            add_poly([t1, t2, t5, t4])
            add_poly([t2, t3, t6, t5])
        else:
            add_poly([t1, t4, t5, t2])
            add_poly([t2, t5, t6, t3])

    parts.append((v, f))
    return merge_parts(parts)

def build_handle(is_base):
    v = []
    f = []
    def add_poly(pts):
        idxs = []
        for p in pts:
            v.append(p)
            idxs.append(len(v))
        f.append(idxs)
        
    # Mango Base connects to Right Jaw, so it goes LEFT (X < 0)
    # Mango Movil connects to Left Jaw, so it goes RIGHT (X > 0)
    sign = -1 if is_base else 1
    
    z_min = -0.5 if is_base else 0.0
    z_max = 0.0 if is_base else 0.5
    
    # Handle path
    spine = [
        (0.0, 0.0),
        (-2.0, sign * 2.2),
        (-5.0, sign * 3.8),
        (-9.0, sign * 4.2),
        (-14.0, sign * 3.5),
        (-16.0, sign * 3.0)
    ]
    
    W = 2.0  # Width
    D = 1.4  # Depth (Thicker than jaw)
    
    sections = []
    for y, x in spine:
        sec = [
            [x - W/2, y, z_min - (D - 0.5)/2],
            [x + W/2, y, z_min - (D - 0.5)/2],
            [x + W/2, y, z_max + (D - 0.5)/2],
            [x - W/2, y, z_max + (D - 0.5)/2]
        ]
        sections.append(sec)
        
    for i in range(len(sections)-1):
        s1 = sections[i]
        s2 = sections[i+1]
        if is_base:
            add_poly([s1[0], s1[1], s2[1], s2[0]]) # Back
            add_poly([s1[2], s1[3], s2[3], s2[2]]) # Front
            add_poly([s1[1], s1[2], s2[2], s2[1]]) # Outer
            add_poly([s1[3], s1[0], s2[0], s2[3]]) # Inner
        else:
            add_poly([s1[0], s2[0], s2[1], s1[1]]) 
            add_poly([s1[2], s2[2], s2[3], s1[3]]) 
            add_poly([s1[1], s2[1], s2[2], s1[2]]) 
            add_poly([s1[3], s2[3], s2[0], s1[0]]) 
            
    s_end = sections[-1]
    if is_base:
        add_poly([s_end[0], s_end[1], s_end[2], s_end[3]])
    else:
        add_poly([s_end[0], s_end[3], s_end[2], s_end[1]])

    return v, f

# Generate files
write_obj("cabeza_base.txt", *build_jaw(True))
write_obj("cabeza_movil.txt", *build_jaw(False))
write_obj("mango_base.txt", *build_handle(True))
write_obj("mango_movil.txt", *build_handle(False))

print("High detail pliers generated successfully.")
