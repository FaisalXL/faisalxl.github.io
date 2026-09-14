#!/usr/bin/env python3
"""Assert the site palette meets WCAG 2.1 AA.

Parses the light (--l-*) and dark (--d-*) token values out of ../styles.css
so this tests the real stylesheet, not a copy of the numbers.

All metadata on the site renders at 10-11px, which is below every large-text
exemption, so 4.5:1 applies to every pair here.
"""
import pathlib
import re
import sys

CSS = pathlib.Path(__file__).resolve().parent.parent / "styles.css"
AA = 4.5

# (foreground token suffix, background token suffix, human label)
PAIRS = [
    ("ink", "bg", "ink on background"),
    ("dim", "bg", "body prose on background"),
    ("muted", "bg", "mono metadata on background"),
    ("accent", "bg", "accent on background"),
]


def parse_tokens(css: str, prefix: str) -> dict:
    """Pull `--<prefix>-<name>: #rrggbb;` declarations into {name: (r, g, b)}."""
    found = {}
    for name, value in re.findall(rf"--{prefix}-([a-z]+)\s*:\s*(#[0-9a-fA-F]{{6}})\s*;", css):
        value = value.lstrip("#")
        found[name] = tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))
    return found


def relative_luminance(rgb: tuple) -> float:
    channels = []
    for raw in rgb:
        c = raw / 255
        channels.append(c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4)
    r, g, b = channels
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(fg: tuple, bg: tuple) -> float:
    a, b = relative_luminance(fg), relative_luminance(bg)
    lighter, darker = max(a, b), min(a, b)
    return (lighter + 0.05) / (darker + 0.05)


def main() -> int:
    if not CSS.exists():
        print(f"FAIL: {CSS} does not exist")
        return 1

    css = CSS.read_text()
    failures = []

    for prefix, theme in (("l", "light"), ("d", "dark")):
        tokens = parse_tokens(css, prefix)
        for fg_name, bg_name, label in PAIRS:
            if fg_name not in tokens or bg_name not in tokens:
                failures.append(f"{theme}: missing token --{prefix}-{fg_name} or --{prefix}-{bg_name}")
                continue
            ratio = contrast(tokens[fg_name], tokens[bg_name])
            status = "ok  " if ratio >= AA else "FAIL"
            print(f"{status} {theme:5} {label:32} {ratio:5.2f}:1")
            if ratio < AA:
                failures.append(f"{theme}: {label} is {ratio:.2f}:1, needs {AA}:1")

    if failures:
        print("\n" + "\n".join(failures))
        return 1

    print("\nAll pairs meet WCAG AA.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
