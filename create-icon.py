#!/usr/bin/env python3
"""
Script para converter SVG para icon.ico
Requer: pip install Pillow cairosvg
"""

import cairosvg
from PIL import Image
from io import BytesIO

# Converte SVG para PNG em memória
svg_data = open('public/phflap-logo.svg', 'rb').read()

# Cria ícones em múltiplas resoluções
sizes = [16, 32, 48, 256]
images = []

for size in sizes:
    # Converte SVG para PNG na resolução específica
    png_data = cairosvg.svg2png(
        bytestring=svg_data,
        output_width=size,
        output_height=size
    )
    # Abre a imagem PNG gerada
    img = Image.open(BytesIO(png_data))
    images.append(img)

# Salva como ICO
images[0].save(
    'public/icon.ico',
    format='ICO',
    sizes=[(s, s) for s in sizes],
    append_images=images[1:]
)

print('✓ icon.ico criado com sucesso a partir do phflap-logo.svg!')
print('  Tamanhos incluídos: 16x16, 32x32, 48x48, 256x256')
