#!/usr/bin/env python3
"""Incorpora la navegación compartida en todas las presentaciones publicadas."""

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
STYLESHEET = '<link rel="stylesheet" href="../../assets/home-navigation.css">'
SCRIPT = '<script src="../../assets/home-navigation.js"></script>'


def update_presentation(path: Path) -> bool:
    html = path.read_text(encoding="utf-8")
    updated = html

    if STYLESHEET not in updated:
        updated = updated.replace("</head>", f"{STYLESHEET}\n</head>", 1)

    if SCRIPT not in updated:
        updated = updated.replace("</body>", f"{SCRIPT}\n</body>", 1)

    if updated == html:
        return False

    path.write_text(updated, encoding="utf-8")
    return True


if __name__ == "__main__":
    presentations = sorted((ROOT / "clases").glob("*/index.html"))
    changed = [path for path in presentations if update_presentation(path)]
    print(f"Presentaciones revisadas: {len(presentations)}")
    print(f"Presentaciones actualizadas: {len(changed)}")
