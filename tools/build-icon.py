#!/usr/bin/env python3
"""
build-icon.py - The Render Rig's icon: Gargantua, centred on the black hole.

  python3 tools/build-icon.py        # writes the icon set + manifest.json into the repo root

Hector, 2026-09-18: "can you center the black hole? and that's gonna be the Icon for the rig!"
The Lounge keeps the Vader painting; the Rig gets the black hole, so the two are never
confused in a row of bookmarks.

THE CENTRE IS MEASURED, NOT EYEBALLED. A first crop by eye was "way off" (his words). The
disc's boundary was traced row by row off a 1/10 preview - the rows where the accretion disk
does NOT occlude it - and a least-squares circle fit through those 34 boundary points gives
centre (5090, 2905), radius 853 in the 10400x6500 original, mean residual 0.9px at preview
scale. Drawing that circle back onto the picture lands it exactly on the hole's edge.

MARGIN is the crop's half-width in hole-radii. 2.6 keeps the whole photon ring with the disk
sweeping out to both edges, and the hole still reads at 60px on a home screen.

The filenames carry a version token on purpose: Safari files its icon answer PER SITE and a
re-added bookmark never clears it, so a name it has never requested is the only way to make
it look again without wiping website data (which would take the Rig's job history with it).
Bump the token if that ever happens again. See the Lounge's tools/build-icon.py for the same.
"""
import json, os
from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(os.path.dirname(os.path.dirname(ROOT)), 'Gargantua.png')  # 10400x6500, not in the repo
CX, CY, R = 5090, 2905, 853
MARGIN = 2.6


def main():
    src = Image.open(SOURCE).convert('RGB')
    side = int(R * 2 * MARGIN)
    left, top = CX - side // 2, CY - side // 2
    square = src.crop((left, top, left + side, top + side))
    print(f'cut {side}x{side} from ({left},{top}) - hole centred at ({CX},{CY}), r={R}')

    out = {'icon-180-v2.png': 180, 'icon-192-v2.png': 192, 'icon-512-v2.png': 512,
           'icon-32-v2.png': 32, 'icon-16-v2.png': 16}
    for name, px in out.items():
        square.resize((px, px), Image.LANCZOS).save(os.path.join(ROOT, name), optimize=True)
        print('wrote', name, px)
    ico = square.resize((48, 48), Image.LANCZOS)
    ico.save(os.path.join(ROOT, 'icon-v2.ico'), sizes=[(48, 48), (32, 32), (16, 16)])
    print('wrote icon-v2.ico', os.path.getsize(os.path.join(ROOT, 'icon-v2.ico')), 'bytes')

    manifest = {'name': 'Render Rig', 'short_name': 'Render Rig',
                'start_url': '/render-rig/', 'scope': '/render-rig/',
                'theme_color': '#0A0708', 'background_color': '#0A0708',
                'icons': [{'src': 'icon-192-v2.png', 'sizes': '192x192', 'type': 'image/png'},
                          {'src': 'icon-512-v2.png', 'sizes': '512x512', 'type': 'image/png'},
                          {'src': 'icon-180-v2.png', 'sizes': '180x180', 'type': 'image/png'}]}
    with open(os.path.join(ROOT, 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)
        f.write('\n')
    print('wrote manifest.json')


if __name__ == '__main__':
    main()
