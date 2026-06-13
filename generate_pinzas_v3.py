import math

def write_obj(filename, vertices, faces):
    with open(filename, 'w') as f:
        for i, v in enumerate(vertices):
            f.write(f"{i+1} {v[0]:.4f} {v[1]:.4f} {v[2]:.4f}\n")
        f.write("Faces:\n")
        for face in faces:
            f.write(" ".join(str(idx) for idx in face) + " .\n")

def make_cylinder(radius, z_min, z_max, segments=24):
    v = []
    f = []
    def add_poly(pts):
        idxs = []
        for p in pts:
            v.append(p)
            idxs.append(len(v))
        f.append(idxs)
        
    for i in range(segments):
        a1 = i * 2 * math.pi / segments
        a2 = (i + 1) * 2 * math.pi / segments
        x1, y1 = radius * math.cos(a1), radius * math.sin(a1)
        x2, y2 = radius * math.cos(a2), radius * math.sin(a2)
        
        add_poly([[0,0,z_min], [x2,y2,z_min], [x1,y1,z_min]])
        add_poly([[0,0,z_max], [x1,y1,z_max], [x2,y2,z_max]])
        add_poly([[x1,y1,z_min], [x2,y2,z_min], [x2,y2,z_max], [x1,y1,z_max]])
    return v, f

def make_prism(x_start, x_end, z_min, z_max, segments, y_bottom_func, y_top_func):
    v = []
    f = []
    def add_poly(pts):
        idxs = []
        for p in pts:
            v.append(p)
            idxs.append(len(v))
        f.append(idxs)
        
    slices = []
    for i in range(segments + 1):
        t = i / segments
        x = x_start + t * (x_end - x_start)
        yb = y_bottom_func(x)
        yt = y_top_func(x)
        slices.append((x, yb, yt))
        
    for i in range(segments):
        x1, yb1, yt1 = slices[i]
        x2, yb2, yt2 = slices[i+1]
        
        v1 = [x1, yb1, z_min]
        v2 = [x1, yt1, z_min]
        v3 = [x1, yt1, z_max]
        v4 = [x1, yb1, z_max]
        
        v5 = [x2, yb2, z_min]
        v6 = [x2, yt2, z_min]
        v7 = [x2, yt2, z_max]
        v8 = [x2, yb2, z_max]
        
        add_poly([v1, v2, v6, v5]) # Back
        add_poly([v4, v8, v7, v3]) # Front
        add_poly([v2, v3, v7, v6]) # Top
        add_poly([v1, v5, v8, v4]) # Bottom
        
        if i == 0:
            add_poly([v1, v4, v3, v2]) # Start cap
        if i == segments - 1:
            add_poly([v5, v6, v7, v8]) # End cap
            
    return v, f

def make_box(x_center, y_min, y_max, z_min, z_max, width):
    v = [
        [x_center - width/2, y_min, z_min],
        [x_center + width/2, y_min, z_min],
        [x_center + width/2, y_max, z_min],
        [x_center - width/2, y_max, z_min],
        [x_center - width/2, y_min, z_max],
        [x_center + width/2, y_min, z_max],
        [x_center + width/2, y_max, z_max],
        [x_center - width/2, y_max, z_max],
    ]
    f = [
        [1, 2, 3, 4], # Back
        [5, 8, 7, 6], # Front
        [1, 5, 6, 2], # Bottom
        [4, 3, 7, 8], # Top
        [1, 4, 8, 5], # Left
        [2, 6, 7, 3], # Right
    ]
    return v, f

def build_half(is_base):
    z_min = -0.5 if is_base else 0.0
    z_max = 0.0 if is_base else 0.5
    
    parts = []
    
    # 1. Pivot
    parts.append(make_cylinder(1.8, z_min, z_max, 32))
    
    # 2. Jaw (X=-6 to X=0)
    def jaw_top(x):
        return -0.0361 * (x**2) + 1.8
    def jaw_bot(x):
        return 0.0
    parts.append(make_prism(-6.0, 0.0, z_min, z_max, 12, jaw_bot, jaw_top))
    
    # 3. Handle (X=0 to X=12)
    def handle_top(x):
        t = x / 12.0
        return 0.0 - t * 2.5 + math.sin(t * math.pi) * 0.8
    def handle_bot(x):
        t = x / 12.0
        return -1.8 - t * 2.0 + math.sin(t * math.pi) * 0.8
    parts.append(make_prism(0.0, 12.0, z_min, z_max, 20, handle_bot, handle_top))
    
    # 4. Stopper pin
    parts.append(make_box(6.0, -0.45, 0.0, z_min, z_max, 0.4))
    
    # 5. Central screw/pin
    if is_base:
        parts.append(make_cylinder(0.5, z_min, z_max + 0.6, 16))
    
    # Merge all parts
    all_v = []
    all_f = []
    for v_list, f_list in parts:
        offset = len(all_v)
        all_v.extend(v_list)
        for f in f_list:
            all_f.append([idx + offset for idx in f])
            
    # If Movil, flip Y and reverse winding
    if not is_base:
        for i in range(len(all_v)):
            all_v[i][1] = -all_v[i][1]
        for i in range(len(all_f)):
            all_f[i].reverse()
            
    return all_v, all_f

write_obj("pinza_base.txt", *build_half(True))
write_obj("pinza_movil.txt", *build_half(False))
print("Blender-style nippers generated successfully.")
