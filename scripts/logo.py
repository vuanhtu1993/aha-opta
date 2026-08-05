import os

c_light_cyan = "#4FB5B5"
c_dark_cyan = "#44ABAC"
c_light_yellow = "#FFD043"
c_dark_yellow = "#FDC425"

triangles = [
    (c_dark_cyan, [(80,20), (120,20), (100,54.64)]),
    (c_light_cyan, [(80,20), (60,54.64), (100,54.64)]),
    (c_light_cyan, [(120,20), (100,54.64), (140,54.64)]),
    (c_dark_cyan, [(60,54.64), (100,54.64), (80,89.28)]),
    (c_light_cyan, [(60,54.64), (40,89.28), (80,89.28)]),
    (c_dark_cyan, [(40,89.28), (80,89.28), (60,123.92)]),
    (c_dark_yellow, [(120,123.92), (80,123.92), (100,89.28)]),
    (c_light_yellow, [(120,123.92), (140,89.28), (100,89.28)]),
    (c_light_yellow, [(80,123.92), (100,89.28), (60,89.28)]),
    (c_dark_yellow, [(140,89.28), (100,89.28), (120,54.64)]),
    (c_light_yellow, [(140,89.28), (160,54.64), (120,54.64)]),
    (c_dark_yellow, [(160,54.64), (120,54.64), (140,20)])
]

svg_icon = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
<g transform="translate(0, 28.04)">
'''
for color, pts in triangles:
    pts_str = " ".join([f"{x},{y}" for x, y in pts])
    svg_icon += f'  <polygon points="{pts_str}" fill="{color}" stroke="{color}" stroke-width="0.5" stroke-linejoin="round"/>\n'
svg_icon += '''</g>
</svg>'''

# ── Bitcount Prop Single Google Font SVG ────────────────────────────────
# Google Fonts: Bitcount Prop Single sử dụng các trọng số (weight) để điều chỉnh độ lớn của chấm tròn:
# - Weight 100-300: Chấm nhỏ, khoảng cách thưa
# - Weight 400-500: Chấm vừa (Medium dot)
# - Weight 700-900: Chấm tròn to, đậm nét (Bold circular dots - giống hình mẫu)

svg_full_font = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 200" width="100%" height="100%">
<defs>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bitcount+Prop+Single:wght@100..900&amp;display=swap');
    .brand-text {
      font-family: 'Bitcount Prop Single', monospace, sans-serif;
      font-size: 72px;
      font-weight: 800;
      fill: #0f172a;
      letter-spacing: 2px;
    }
  </style>
</defs>
<g transform="translate(30, 28.04)">
'''
for color, pts in triangles:
    pts_str = " ".join([f"{x},{y}" for x, y in pts])
    svg_full_font += f'  <polygon points="{pts_str}" fill="{color}" stroke="{color}" stroke-width="0.5" stroke-linejoin="round"/>\n'
svg_full_font += '''</g>
<text x="225" y="124" class="brand-text">Aha mind</text>
</svg>'''

# ── Pure Vector Circle Matrix Generator (Độc lập 100%, không phụ thuộc tải font mạng) ─
# Ma trận chấm tròn chuẩn 5x7 / 5x9 của chữ "Aha mind"
DOT_MATRIX = {
    'A': [
        " ... ",
        ".   .",
        ".   .",
        ".....",
        ".   .",
        ".   .",
        ".   ."
    ],
    'h': [
        ".    ",
        ".    ",
        ".... ",
        ".   .",
        ".   .",
        ".   .",
        ".   ."
    ],
    'a': [
        "     ",
        "     ",
        " ....",
        "    .",
        " ....",
        ".   .",
        " ...."
    ],
    ' ': [
        "  ",
        "  ",
        "  ",
        "  ",
        "  ",
        "  ",
        "  "
    ],
    'm': [
        "       ",
        "       ",
        "... ...",
        ".  .  .",
        ".  .  .",
        ".  .  .",
        ".  .  ."
    ],
    'i': [
        " . ",
        "   ",
        " . ",
        " . ",
        " . ",
        " . ",
        " . "
    ],
    'n': [
        "     ",
        "     ",
        ".... ",
        ".   .",
        ".   .",
        ".   .",
        ".   ."
    ],
    'd': [
        "    .",
        "    .",
        " ....",
        ".   .",
        ".   .",
        ".   .",
        " ...."
    ]
}

def render_vector_dot_matrix_svg(text="Aha mind", dot_r=3.8, pitch=9.5, start_x=225, start_y=68, color="#0f172a"):
    circles = []
    curr_x = start_x
    for ch in text:
        grid = DOT_MATRIX.get(ch, DOT_MATRIX[' '])
        char_width = len(grid[0])
        for row_idx, row_str in enumerate(grid):
            for col_idx, c in enumerate(row_str):
                if c == '.':
                    cx = curr_x + col_idx * pitch
                    cy = start_y + row_idx * pitch
                    circles.append(f'  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{dot_r}" fill="{color}"/>')
        curr_x += (char_width + 1) * pitch  # Khoảng cách giữa các ký tự
    return "\n".join(circles)

svg_vector_dots = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 200" width="100%" height="100%">
<g transform="translate(30, 28.04)">
'''
for color, pts in triangles:
    pts_str = " ".join([f"{x},{y}" for x, y in pts])
    svg_vector_dots += f'  <polygon points="{pts_str}" fill="{color}" stroke="{color}" stroke-width="0.5" stroke-linejoin="round"/>\n'
svg_vector_dots += '</g>\n<g id="brand-dots">\n'
svg_vector_dots += render_vector_dot_matrix_svg("Aha mind", dot_r=3.8, pitch=9.2, start_x=225, start_y=72, color="#0f172a")
svg_vector_dots += '\n</g>\n</svg>'

# ── Xuất các định dạng file ─────────────────────────────────────────────
with open('aha_mind_icon_transparent.svg', 'w') as f:
    f.write(svg_icon)

# 1. Bản Web Font Bitcount Prop Single (Google Fonts)
with open('aha_mind_logo_full_transparent.svg', 'w') as f:
    f.write(svg_full_font)

# 2. Bản Pure Vector Dots (Chấm tròn vector thuần túy, render sắc nét không lo lag font)
with open('aha_mind_logo_vector_dots.svg', 'w') as f:
    f.write(svg_vector_dots)

# 3. Đồng bộ ra thư mục public/ cho Next.js App
with open('public/logo.svg', 'w') as f:
    f.write(svg_full_font)

print("✅ Đã xuất bản thành công:")
print("1. aha_mind_icon_transparent.svg (Icon)")
print("2. aha_mind_logo_full_transparent.svg (Google Font Bitcount Prop Single wght=800)")
print("3. aha_mind_logo_vector_dots.svg (Pure Vector Circle Dots)")
print("4. public/logo.svg (Đồng bộ vào Next.js)")