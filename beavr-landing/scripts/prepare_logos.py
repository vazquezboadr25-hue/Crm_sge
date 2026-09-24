from PIL import Image
from pathlib import Path

assets = Path(r"C:\Users\jaime\.cursor\projects\c-Users-jaime-beavr-landing\assets")
public = Path(r"C:\Users\jaime\beavr-landing\public")

pairs = [
    (
        "c__Users_jaime_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_17_sept_2026__13_09_49-2ddd0ea8-9387-423b-a2c5-058c0a2efb2e.png",
        "logo-full.png",
    ),
    (
        "c__Users_jaime_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_ChatGPT_Image_17_sept_2026__13_10_48-827149bb-5ba6-4f7b-af31-45b448929082.png",
        "logo-mark.png",
    ),
]


def remove_black_bg(src: Path, dst: Path, threshold: int = 40) -> None:
    img = Image.open(src).convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if r <= threshold and g <= threshold and b <= threshold:
                pixels[x, y] = (r, g, b, 0)
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.save(dst, "PNG")
    print(dst.name, img.size)


for src_name, dst_name in pairs:
    remove_black_bg(assets / src_name, public / dst_name)

for old in ("logo.png", "logo.jfif"):
    p = public / old
    if p.exists():
        p.unlink()
        print("removed", old)
