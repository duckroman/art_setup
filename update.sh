#!/bin/bash

echo "🔄 Iniciando actualización de ArtSetup..."

cd /var/www/art_setup || exit 1

# Descargar cambios
echo "📥 Descargando cambios de GitHub..."
git pull || { echo "❌ Error en git pull"; exit 1; }

# Actualizar Backend
echo "🔧 Actualizando Backend..."
cd backend || exit 1
npm install || { echo "❌ Error instalando dependencias backend"; exit 1; }
npm run build || { echo "❌ Error compilando backend"; exit 1; }
pm2 restart artsetup-backend || { echo "❌ Error reiniciando backend"; exit 1; }
echo "✅ Backend actualizado"

# Actualizar Frontend
echo "🎨 Actualizando Frontend..."
cd ../frontend || exit 1
npm install || { echo "❌ Error instalando dependencias frontend"; exit 1; }
npm run build || { echo "❌ Error compilando frontend"; exit 1; }
echo "✅ Frontend actualizado"

echo ""
echo "✅ ✅ ✅ Actualización completada exitosamente"
echo "Tu sitio está disponible en: https://artsetup.jrc-projects.cloud"
