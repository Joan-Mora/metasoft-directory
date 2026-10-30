#!/usr/bin/env python3
"""
© Joan Mora — Proprietary. See LICENSE.
Seed MongoDB with Tabla 1 casas desarrolladoras + light web enrichment.
"""
from __future__ import annotations

import hashlib
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pymongo import MongoClient

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / "backend" / ".env")

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017/directorio_casas")
ASSETS = Path(__file__).resolve().parent / "assets" / "downloads"
ASSETS.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "User-Agent": "DirectorioCasasSeed/1.0 (+academic; Uniminuto Taller Joan Mora)",
    "Accept": "text/html,application/xhtml+xml",
}

# Tabla 1 + curated official / candidate websites (may be empty → dataStatus none/partial)
COMPANIES = [
    {
        "name": "CODALTEC",
        "address": "Av. 40 # 24A - 71",
        "specialty": "Simulación & Ciberseguridad",
        "phone": "300 639 8324",
        "website": "https://www.codaltec.com",
    },
    {
        "name": "SASOFTCO",
        "address": "Cra 44B # 18-43 Mz D Ca 15",
        "specialty": "ERP a Medida, Apps Mobile",
        "phone": "310 550 7137",
        "website": "https://www.sasoftco.com",
    },
    {
        "name": "Ideas Software",
        "address": "Villavicencio, Meta",
        "specialty": "Sistemas Administrativos",
        "phone": "320 494 9937",
        "website": "",
    },
    {
        "name": "Pegasus Software",
        "address": "Cra 19A # 35A - 54",
        "specialty": "Contabilidad & Facturación POS",
        "phone": "313 466 7526",
        "website": "",
    },
    {
        "name": "Seobyte",
        "address": "Villavicencio, Meta",
        "specialty": "Desarrollo Web & E-commerce",
        "phone": "310 550 7137",
        "website": "https://seobyte.co",
    },
    {
        "name": "Software & Apps Col",
        "address": "Cr 19B # 22-03 Macarena",
        "specialty": "Apps Móviles & Web",
        "phone": "311 482 9001",
        "website": "",
    },
    {
        "name": "SPS Solutions",
        "address": "Calle 4A # 17-88 Vizcaya",
        "specialty": "Infraestructura TI & Web",
        "phone": "314 511 5938",
        "website": "",
    },
    {
        "name": "Ingesoft Orinoquía",
        "address": "Calle 33A # 38-25 Barzal",
        "specialty": "ERP & Nómina Electrónica",
        "phone": "(8) 670 4120",
        "website": "",
    },
    {
        "name": "Synergia Tech",
        "address": "Cra 39 # 26C-12 7 de Agosto",
        "specialty": "E-learning & EdTech",
        "phone": "321 908 4312",
        "website": "",
    },
    {
        "name": "SoftLlanos",
        "address": "Calle 15 # 40-08 Camoa",
        "specialty": "POS & Inventarios",
        "phone": "312 345 8901",
        "website": "",
    },
    {
        "name": "Llanotec",
        "address": "Av. Circunvalar # 35-10",
        "specialty": "Software Médico & Salud",
        "phone": "318 765 4321",
        "website": "",
    },
    {
        "name": "AgroSoft Meta",
        "address": "Calle 26 Sur # 48-12",
        "specialty": "Software Agrícola & Ganadero",
        "phone": "315 890 1234",
        "website": "",
    },
    {
        "name": "MetaDevs Lab",
        "address": "Cra 38 # 33B-15 Barzal",
        "specialty": "APIs, Cloud & SaaS",
        "phone": "310 987 6543",
        "website": "",
    },
    {
        "name": "Global Code",
        "address": "Calle 15 # 37E-22 Esperanza",
        "specialty": "E-commerce B2B / B2C",
        "phone": "322 123 4567",
        "website": "",
    },
    {
        "name": "InnovaApp Tech",
        "address": "Cra 40 # 20-55 Centauros",
        "specialty": "Apps de Logística & Domicilios",
        "phone": "317 654 3210",
        "website": "",
    },
]


def compute_status(doc: dict) -> str:
    relevant = [
        doc.get("address"),
        doc.get("specialty"),
        doc.get("phone"),
        doc.get("website"),
        doc.get("logoUrl"),
        doc.get("bannerUrl"),
        doc.get("description"),
        bool(doc.get("links")),
        bool(doc.get("highlights")),
    ]
    count = sum(1 for v in relevant if (isinstance(v, str) and v.strip()) or (v is True))
    if count == 0:
        return "none"
    has_core = all(str(doc.get(k) or "").strip() for k in ("address", "specialty", "phone"))
    has_enrich = all(str(doc.get(k) or "").strip() for k in ("website", "logoUrl", "description"))
    if has_core and has_enrich:
        return "complete"
    return "partial"


def safe_get(url: str) -> tuple[str | None, str | None]:
    try:
        r = requests.get(url, headers=HEADERS, timeout=12, allow_redirects=True)
        if r.status_code >= 400:
            return None, None
        ctype = r.headers.get("content-type", "")
        if "text/html" not in ctype and "application/xhtml" not in ctype:
            return None, None
        return r.text, r.url
    except requests.RequestException:
        return None, None


def download_asset(url: str, prefix: str) -> str:
    if not url:
        return ""
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        if r.status_code >= 400 or not r.content:
            return url
        ext = ".png"
        ctype = r.headers.get("content-type", "")
        if "jpeg" in ctype or "jpg" in ctype:
            ext = ".jpg"
        elif "webp" in ctype:
            ext = ".webp"
        elif "svg" in ctype:
            ext = ".svg"
        name = hashlib.sha1(url.encode()).hexdigest()[:16]
        path = ASSETS / f"{prefix}_{name}{ext}"
        path.write_bytes(r.content)
        return str(path.as_posix())
    except requests.RequestException:
        return url


def enrich(base: dict) -> dict:
    doc = {
        **base,
        "logoUrl": "",
        "bannerUrl": "",
        "links": [],
        "description": "",
        "highlights": [],
        "manuallyModified": False,
        "sourceUrl": base.get("website") or "",
        "scrapedAt": None,
    }
    website = (base.get("website") or "").strip()
    if not website:
        doc["description"] = (
            f"{base['name']} figura en el directorio académico de casas desarrolladoras "
            f"con especialidad en {base['specialty']}. No se registró sitio web oficial "
            "verificado al momento del seed."
        )
        doc["highlights"] = [base["specialty"], base["address"], f"Tel: {base['phone']}"]
        doc["dataStatus"] = compute_status(doc)
        return doc

    html, final_url = safe_get(website)
    if not html:
        doc["description"] = (
            f"{base['name']} tiene URL candidata ({website}) pero no fue posible "
            "extraer contenido HTML en el seed. Se conservan los datos de la Tabla 1."
        )
        doc["highlights"] = [base["specialty"], base["address"]]
        doc["dataStatus"] = compute_status(doc)
        return doc

    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    title = ""
    og_title = soup.find("meta", property="og:title")
    if og_title and og_title.get("content"):
        title = og_title["content"].strip()
    elif soup.title and soup.title.string:
        title = soup.title.string.strip()

    meta_desc = ""
    og_desc = soup.find("meta", property="og:description")
    if og_desc and og_desc.get("content"):
        meta_desc = og_desc["content"].strip()
    else:
        md = soup.find("meta", attrs={"name": "description"})
        if md and md.get("content"):
            meta_desc = md["content"].strip()

    og_image = ""
    ogi = soup.find("meta", property="og:image")
    if ogi and ogi.get("content"):
        og_image = urljoin(final_url or website, ogi["content"])

    logo = ""
    icon = soup.find("link", rel=lambda v: v and "icon" in v)
    if icon and icon.get("href"):
        logo = urljoin(final_url or website, icon["href"])
    if not logo:
        img = soup.find("img", alt=re.compile("logo", re.I))
        if img and img.get("src"):
            logo = urljoin(final_url or website, img["src"])
    if not logo:
        logo = og_image

    links: list[str] = []
    for a in soup.find_all("a", href=True):
        href = urljoin(final_url or website, a["href"])
        if re.search(r"linkedin|twitter|facebook|instagram|github|whatsapp|mailto:", href, re.I):
            if href not in links:
                links.append(href)
        if len(links) >= 6:
            break

    headings = [
        h.get_text(" ", strip=True)
        for h in soup.find_all(["h1", "h2"])[:5]
        if h.get_text(strip=True)
    ]

    description = meta_desc or (
        f"{title or base['name']} ofrece servicios de {base['specialty']}. "
        f"Información enriquecida desde {urlparse(final_url or website).netloc}."
    )
    if len(description) > 800:
        description = description[:797] + "..."

    doc.update(
        {
            "website": final_url or website,
            "sourceUrl": final_url or website,
            "logoUrl": download_asset(logo, "logo") if logo.startswith("http") else logo,
            "bannerUrl": download_asset(og_image, "banner") if og_image.startswith("http") else og_image,
            "links": links,
            "description": description,
            "highlights": headings[:4] or [base["specialty"], base["address"]],
            "scrapedAt": datetime.now(timezone.utc),
        }
    )
    # Prefer remote URLs for UI if local path (browser can't read disk) — store original remote
    if logo.startswith("http"):
        doc["logoUrl"] = logo
    if og_image.startswith("http"):
        doc["bannerUrl"] = og_image

    doc["dataStatus"] = compute_status(doc)
    return doc


def main() -> int:
    print(f"Connecting to {MONGODB_URI}")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    db = client.get_default_database()
    if db is None:
        db = client["directorio_casas"]
    col = db["companies"]

    upserted = 0
    for base in COMPANIES:
        print(f"→ {base['name']} …", flush=True)
        doc = enrich(base)
        col.update_one(
            {"name": doc["name"]},
            {"$set": doc, "$setOnInsert": {"createdAt": datetime.now(timezone.utc)}},
            upsert=True,
        )
        upserted += 1
        print(f"  status={doc['dataStatus']} website={doc.get('website') or '-'}")

    print(f"Done. Upserted {upserted} companies.")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"Seed failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
