"""Extract individual character poses from the presentation sprite sheets.

The sheets place poses on a near-black background with small white text labels,
plus a bottom band of faces / items / effects / UI we don't want. We color-key
the dark background, label connected components, keep character-sized blobs in
the upper animation rows, and write each as a trimmed transparent PNG. A labeled
contact sheet is produced for visual verification.
"""
import os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

RAW = "assets/raw"
OUT = "assets/cut"
os.makedirs(OUT, exist_ok=True)

SHEETS = {
    "andrew": "4a99e6fa-9E195ADFC1C141A3A58050B0874913E7.png",
    "kalong": "27c23c8d-5BC412441DF249B18DBB071F2ECDA85E.png",
    "owen":   "e9c16a43-3AFAFFEF9A3C4137BF440F7B05CD6C29.png",
    "elliot": "ee1adece-E37B12BB55914F9C94D4725BBC3D9F05.png",
}

def alpha_from_brightness(rgb, lo=28, hi=70):
    b = rgb.max(axis=2).astype(np.float32)
    a = np.clip((b - lo) / (hi - lo), 0, 1)
    return a

def extract(name, path):
    im = Image.open(path).convert("RGB")
    W, H = im.size
    rgb = np.asarray(im)
    alpha = alpha_from_brightness(rgb)
    mask = alpha > 0.35

    # Only look at the animation rows (top portion); drop faces/items/ui band.
    row_cut = int(H * 0.60)
    region = mask.copy()
    region[row_cut:, :] = False

    # Connect nearby body parts, then label.
    dil = ndimage.binary_dilation(region, iterations=3)
    lbl, n = ndimage.label(dil)
    boxes = ndimage.find_objects(lbl)

    blobs = []
    for i, sl in enumerate(boxes, start=1):
        if sl is None:
            continue
        ys, xs = sl
        y0, y1, x0, x1 = ys.start, ys.stop, xs.start, xs.stop
        h, w = y1 - y0, x1 - x0
        area = int(mask[y0:y1, x0:x1].sum())
        # Character-sized filter: tall enough, enough pixels, not a text label.
        if h < 90 or w < 45 or area < 4500:
            continue
        if h > H * 0.45:  # giant merged blob -> skip
            continue
        blobs.append((x0, y0, x1, y1, area))

    # Sort into reading order (rows top->bottom, then left->right).
    blobs.sort(key=lambda b: (round(b[1] / (H * 0.12)), b[0]))

    meta = []
    full_alpha = (alpha * 255).astype(np.uint8)
    for idx, (x0, y0, x1, y1, area) in enumerate(blobs):
        pad = 6
        cx0, cy0 = max(0, x0 - pad), max(0, y0 - pad)
        cx1, cy1 = min(W, x1 + pad), min(H, y1 + pad)
        crop_rgb = rgb[cy0:cy1, cx0:cx1]
        crop_a = full_alpha[cy0:cy1, cx0:cx1]
        out = np.dstack([crop_rgb, crop_a]).astype(np.uint8)
        Image.fromarray(out, "RGBA").save(f"{OUT}/{name}_{idx:02d}.png")
        meta.append({"idx": idx, "x": cx0, "y": cy0, "w": cx1 - cx0, "h": cy1 - cy0, "area": area})
    return meta

def contact_sheet(name, meta):
    cols = 6
    cell = 200
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
    except Exception:
        font = ImageFont.load_default()
    rows = (len(meta) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cell, rows * cell), (40, 40, 50, 255))
    d = ImageDraw.Draw(sheet)
    for m in meta:
        sp = Image.open(f"{OUT}/{name}_{m['idx']:02d}.png")
        sp.thumbnail((cell - 20, cell - 50))
        r, c = divmod(m["idx"], cols)
        px, py = c * cell, r * cell
        sheet.alpha_composite(sp, (px + (cell - sp.width)//2, py + 44))
        d.rectangle([px, py, px + 54, py + 40], fill=(0, 0, 0, 220))
        d.text((px + 6, py + 2), f"{m['idx']}", fill=(255, 220, 60, 255), font=font)
        d.rectangle([px, py, px + cell - 1, py + cell - 1], outline=(90, 90, 110, 255))
    sheet.save(f"{OUT}/_contact_{name}.png")

allmeta = {}
for name, fn in SHEETS.items():
    meta = extract(name, os.path.join(RAW, fn))
    contact_sheet(name, meta)
    allmeta[name] = meta
    print(f"{name}: {len(meta)} poses")
json.dump(allmeta, open(f"{OUT}/_meta.json", "w"), indent=1)
