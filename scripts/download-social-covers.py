#!/usr/bin/env python3
"""Import verified public AJN Instagram post cover images into local WebP assets.

Temporary maintainer utility. Requires Pillow and network access.
Never embeds Instagram scripts into the site or stores signed CDN URLs.
"""
import html
import json
import sys
from html.parser import HTMLParser
from io import BytesIO
from pathlib import Path
from urllib.request import Request, urlopen

from PIL import Image, ImageOps, UnidentifiedImageError

USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)
MAX_BYTES = 8_000_000


class MetaParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = {}

    def handle_starttag(self, tag, attrs):
        if tag.lower() != "meta":
            return
        a = dict(attrs)
        key = a.get("property") or a.get("name")
        if key and a.get("content"):
            self.meta[key.lower()] = html.unescape(a["content"])


def download(url, referer="https://www.instagram.com/"):
    req = Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.7",
        "Referer": referer,
    })
    with urlopen(req, timeout=25) as response:
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES:
            raise ValueError("Remote resource exceeds 8 MB limit")
        return data


def cover_url(post_url):
    body = download(post_url)
    parser = MetaParser()
    parser.feed(body.decode("utf-8", errors="replace"))
    og_title = parser.meta.get("og:title", "")
    image_url = parser.meta.get("og:image")
    if "ajn" not in og_title.lower():
        raise ValueError("Unable to verify @ajnengenharia as the original publisher")
    if not image_url or not image_url.startswith("https://"):
        raise ValueError("No official Instagram Open Graph cover found")
    return image_url


def main():
    items = json.loads(Path("scripts/social-cover-sources.json").read_text())
    for item in items:
        src = cover_url(item["post_url"])
        data = download(src)
        try:
            image = Image.open(BytesIO(data))
            image.verify()
            image = Image.open(BytesIO(data))
            image = ImageOps.exif_transpose(image).convert("RGB")
        except (OSError, UnidentifiedImageError) as error:
            raise ValueError("Downloaded resource is not a valid image") from error
        if image.width < 200 or image.height < 200:
            raise ValueError("Invalid small Instagram cover")
        image.thumbnail((720, 900), Image.Resampling.LANCZOS)
        path = Path(item["file"])
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path, "WEBP", quality=83, method=6)
        print(f"Imported {item['id']} ({image.width}x{image.height}, {path.stat().st_size} bytes)")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Cover import failed safely: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
