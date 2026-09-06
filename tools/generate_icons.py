#!/usr/bin/env python3
"""Generate the app icons.

No image library is available here, so this writes PNGs directly: an opaque
RGB bitmap, zlib-compressed, wrapped in the three chunks a PNG needs. The mark
is a terminal prompt -- a chevron and an underscore -- drawn as thick round-
capped strokes and supersampled for smooth edges at small sizes.

Icons are opaque on purpose: iOS composites apple-touch-icon over black, so a
transparent background would come out with dark fringing.
"""
import pathlib
import struct
import zlib

OUT = pathlib.Path(__file__).resolve().parent.parent / "docs" / "icons"

TOP = (0x74, 0x62, 0xF5)
BOTTOM = (0x46, 0x36, 0xC0)
INK = (0xFF, 0xFF, 0xFF)
SUPERSAMPLE = 4


def png_chunk(tag, payload):
    return (struct.pack(">I", len(payload)) + tag + payload
            + struct.pack(">I", zlib.crc32(tag + payload) & 0xFFFFFFFF))


def write_png(path, size, pixels):
    raw = b"".join(b"\x00" + bytes(row) for row in pixels)
    header = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", header)
        + png_chunk(b"IDAT", zlib.compress(raw, 9))
        + png_chunk(b"IEND", b"")
    )


def distance_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    length_sq = dx * dx + dy * dy
    t = 0.0 if length_sq == 0 else max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / length_sq))
    cx, cy = ax + t * dx, ay + t * dy
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5


def render(size, inset):
    """inset is the fraction of the canvas kept clear around the mark."""
    unit = size * (1 - 2 * inset)
    origin = size * inset
    stroke = unit * 0.115

    def u(x, y):
        return origin + x * unit, origin + y * unit

    strokes = [
        (*u(0.24, 0.26), *u(0.50, 0.50)),
        (*u(0.50, 0.50), *u(0.24, 0.74)),
        (*u(0.58, 0.74), *u(0.80, 0.74)),
    ]

    rows = []
    step = 1.0 / SUPERSAMPLE
    for y in range(size):
        row = bytearray()
        base = [
            round(TOP[i] + (BOTTOM[i] - TOP[i]) * (y / max(1, size - 1)))
            for i in range(3)
        ]
        for x in range(size):
            hits = 0
            for sy in range(SUPERSAMPLE):
                py = y + (sy + 0.5) * step
                for sx in range(SUPERSAMPLE):
                    px = x + (sx + 0.5) * step
                    if any(distance_to_segment(px, py, *s) <= stroke / 2 for s in strokes):
                        hits += 1
            if hits == 0:
                row.extend(base)
            else:
                coverage = hits / (SUPERSAMPLE * SUPERSAMPLE)
                row.extend(round(base[i] + (INK[i] - base[i]) * coverage) for i in range(3))
        rows.append(row)
    return rows


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    # A maskable icon gets cropped to a circle by some launchers, so its mark
    # sits further in than the plain one.
    targets = [
        ("icon-180.png", 180, 0.20),
        ("icon-192.png", 192, 0.20),
        ("icon-512.png", 512, 0.20),
        ("icon-512-maskable.png", 512, 0.28),
    ]
    for name, size, inset in targets:
        write_png(OUT / name, size, render(size, inset))
        print(f"wrote {name} ({size}x{size}, {(OUT / name).stat().st_size} bytes)")


if __name__ == "__main__":
    main()
