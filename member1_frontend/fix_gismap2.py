filepath = "src/components/gis/GISMapView.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    code = f.read()

import re

use_effect_code = """
  // Hide main padding/scrollbar for full-bleed map
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.style.overflow = 'hidden';
      mainEl.style.padding = '0';
    }
    return () => {
      if (mainEl) {
        mainEl.style.overflow = '';
        mainEl.style.padding = '';
      }
    };
  }, []);
"""

code = code.replace('const GISMapView: React.FC = () => {', 'const GISMapView: React.FC = () => {' + use_effect_code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(code)

print("GIS Map alignment fixed.")
