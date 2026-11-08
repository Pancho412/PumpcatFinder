"""
Genera los cuadrados (tiles) y la vista previa de cada mapa para Pumpcat Finder.

Uso (desde la carpeta ModUtils):
    pip install pillow
    python tools/make_tiles.py                 # todas las regiones
    python tools/make_tiles.py sinnoh          # solo una

Vuelve a correrlo cada vez que cambies una imagen de mapa en img/.
Resultado:
    img/tiles/<region>/preview.webp            vista completa a 1/PREVIEW_SCALE
    img/tiles/<region>/<col>_<row>.webp        cuadrados TILE x TILE a resolución completa
"""
import os
import sys
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

TILE = 1024            # debe coincidir con MAP_TILE en src/map.js
PREVIEW_SCALE = 4      # debe coincidir con MAP_PREVIEW_SCALE en src/map.js

# región -> imagen fuente (mismas que map.html)
MAPS = {
    "kanto":  "img/map.png",
    "johto":  "img/map3.png",
    "hoenn":  "img/map2.png",
    "sinnoh": "img/map4.png",
    "unova":  "img/map5.png",
}

_img = None


def _init(path):
    global _img
    _img = Image.open(path)
    _img.load()


def _save_tile(args):
    out_dir, col, row = args
    w, h = _img.size
    box = (col * TILE, row * TILE, min((col + 1) * TILE, w), min((row + 1) * TILE, h))
    tile = _img.crop(box)
    if tile.mode not in ("RGB", "RGBA"):
        tile = tile.convert("RGBA")
    tile.save(os.path.join(out_dir, f"{col}_{row}.webp"), "WEBP", lossless=True, method=4)
    return 1


def build(region, src):
    out_dir = os.path.join("img", "tiles", region)
    os.makedirs(out_dir, exist_ok=True)
    for f in os.listdir(out_dir):
        if f.endswith(".webp"):
            os.remove(os.path.join(out_dir, f))

    img = Image.open(src)
    w, h = img.size
    print(f"{region}: {src} {w}x{h}")

    preview = img.convert("RGBA").resize(
        (max(1, round(w / PREVIEW_SCALE)), max(1, round(h / PREVIEW_SCALE))), Image.BOX)
    preview.save(os.path.join(out_dir, "preview.webp"), "WEBP", lossless=True, method=4)

    cols = (w + TILE - 1) // TILE
    rows = (h + TILE - 1) // TILE
    jobs = [(out_dir, c, r) for r in range(rows) for c in range(cols)]
    with ProcessPoolExecutor(initializer=_init, initargs=(src,)) as ex:
        done = sum(ex.map(_save_tile, jobs))
    print(f"  {done} tiles ({cols}x{rows}) + preview")


if __name__ == "__main__":
    wanted = sys.argv[1:] or list(MAPS)
    for region in wanted:
        build(region, MAPS[region])
