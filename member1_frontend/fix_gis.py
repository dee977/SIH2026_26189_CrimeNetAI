import re

with open("src/components/gis/GISMapView.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "<div className=\"flex h-full w-full bg-[#0a111a] text-[var(--text-primary)]\">",
    "<div className=\"absolute inset-0 flex bg-[#0a111a] text-[var(--text-primary)] z-[10] overflow-hidden\">"
)

google_map_layer = \"\"\"        // Google Maps Hybrid (Satellite + Labels) - Professional real-life view
        L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
          attribution: '&copy; Google Maps',
          maxZoom: 20
        }).addTo(map);\"\"\"

c = re.sub(
    r\"L.tileLayer('https://\{s\}\.basemaps\.cartocdn\.com/[^']+', \{?[\s\S]*?\})\.addTo(map);\",
    google_map_layer,
    c
(

with open("src/components/gis/GISMapView.tsx", "w", encoding="utf-8") as f:
    f.write(c)
