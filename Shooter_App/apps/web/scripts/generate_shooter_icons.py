import os
from PIL import Image, ImageDraw

def render_target_canvas(size, bg_color=None, is_round=False, is_foreground_only=False):
    # Supersample at 4x for high-res crisp edges
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = canvas_size / 2.0
    cy = canvas_size / 2.0

    # Draw background if needed
    if not is_foreground_only:
        bg_rgba = (8, 10, 15, 255) # #080A0F
        if is_round:
            draw.ellipse([0, 0, canvas_size - 1, canvas_size - 1], fill=bg_rgba)
        else:
            # Rounded rectangle for squircle/adaptive icon look
            corner_radius = int(canvas_size * 0.22)
            draw.rounded_rectangle([0, 0, canvas_size - 1, canvas_size - 1], radius=corner_radius, fill=bg_rgba)

    # In adaptive foreground mode, keep within the central 66% safe zone
    target_scale = 0.68 if is_foreground_only else 0.82
    max_radius = (canvas_size / 2.0) * target_scale

    outer_r = max_radius * 0.96
    mid_r = max_radius * 0.68
    inner_r = max_radius * 0.29
    dot_r = max_radius * 0.11
    stroke_w = max(1, int(canvas_size * 0.024))

    # Outer ring: #F5A623 with 55% opacity
    draw.ellipse([cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r],
                 outline=(245, 166, 35, 140), width=stroke_w)

    # Mid ring: #F5A623 with 85% opacity
    draw.ellipse([cx - mid_r, cy - mid_r, cx + mid_r, cy + mid_r],
                 outline=(245, 166, 35, 217), width=stroke_w)

    # Inner ring: #F5A623 with 100% opacity
    draw.ellipse([cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
                 outline=(245, 166, 35, 255), width=stroke_w)

    # Center dot: #F5A623 solid
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r],
                 fill=(245, 166, 35, 255))

    # Crosshair lines
    gap_inner = inner_r + (stroke_w * 1.5)
    gap_outer = outer_r + (stroke_w * 1.5)

    # Top
    draw.line([(cx, cy - gap_outer), (cx, cy - gap_inner)], fill=(245, 166, 35, 255), width=stroke_w)
    # Bottom
    draw.line([(cx, cy + gap_inner), (cx, cy + gap_outer)], fill=(245, 166, 35, 255), width=stroke_w)
    # Left
    draw.line([(cx - gap_outer, cy), (cx - gap_inner, cy)], fill=(245, 166, 35, 255), width=stroke_w)
    # Right
    draw.line([(cx + gap_inner, cy), (cx + gap_outer, cy)], fill=(245, 166, 35, 255), width=stroke_w)

    # Downsample with Lanczos antialiasing
    return img.resize((size, size), Image.Resampling.LANCZOS)

def main():
    base_res = r"d:\App and Hardware Project\App\Marksman\Shooter_App\apps\web\android\app\src\main\res"
    densities = {
        "mipmap-mdpi": {"icon": 48, "foreground": 108},
        "mipmap-hdpi": {"icon": 72, "foreground": 162},
        "mipmap-xhdpi": {"icon": 96, "foreground": 216},
        "mipmap-xxhdpi": {"icon": 144, "foreground": 324},
        "mipmap-xxxhdpi": {"icon": 192, "foreground": 432},
    }

    print("Generating Shooter App golden target icons...")
    for folder, sizes in densities.items():
        folder_path = os.path.join(base_res, folder)
        os.makedirs(folder_path, exist_ok=True)
        
        icon_sz = sizes["icon"]
        fg_sz = sizes["foreground"]

        # 1. ic_launcher.png (square / squircle)
        sq_img = render_target_canvas(icon_sz, is_round=False)
        sq_img.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")

        # 2. ic_launcher_round.png
        rd_img = render_target_canvas(icon_sz, is_round=True)
        rd_img.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")

        # 3. ic_launcher_foreground.png (adaptive)
        fg_img = render_target_canvas(fg_sz, is_foreground_only=True)
        fg_img.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")

        # 4. ic_launcher_background.png
        bg_img = Image.new("RGBA", (fg_sz, fg_sz), (8, 10, 15, 255))
        bg_img.save(os.path.join(folder_path, "ic_launcher_background.png"), "PNG")

        print(f"  Generated {folder} (icon: {icon_sz}x{icon_sz}, fg: {fg_sz}x{fg_sz})")

    # Also generate web assets/icon.png (1024x1024)
    master_path = r"d:\App and Hardware Project\App\Marksman\Shooter_App\apps\web\assets\icon.png"
    master_img = render_target_canvas(1024, is_round=False)
    master_img.save(master_path, "PNG")
    print(f"Generated master {master_path} (1024x1024)")

    # Also public icon-192 and icon-512 for web
    web_public = r"d:\App and Hardware Project\App\Marksman\Shooter_App\apps\web\public"
    p192 = render_target_canvas(192, is_round=False)
    p192.save(os.path.join(web_public, "icon-192.png"), "PNG")
    p512 = render_target_canvas(512, is_round=False)
    p512.save(os.path.join(web_public, "icon-512.png"), "PNG")
    print("Generated web public icons (192, 512)")
    print("SUCCESS: All Shooter App old target logo icons generated!")

if __name__ == "__main__":
    main()
