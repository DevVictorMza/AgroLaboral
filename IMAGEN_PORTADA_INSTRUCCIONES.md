# 🖼️ Instrucciones para Cambiar la Imagen de Portada

## 📂 Cómo aplicar tu propia imagen de portada

### Método 1: Imagen Local (Recomendado)

1. **Coloca tu imagen** en la carpeta `img/` 
   ```
   proyecto/
   ├── img/
   │   └── tu-imagen-portada.jpg  ← Aquí
   └── css/
       └── style.css
   ```

2. **Edita el archivo CSS** en `css/style.css`
   - Busca la línea con `background-image: url(...)`
   - Cámbiala por: `background-image: url('../img/tu-imagen-portada.jpg');`

### Método 2: Imagen Externa

1. **Usa una URL directa** de una imagen en línea
   - Edita `css/style.css`
   - Cambia: `background-image: url('https://tu-url-de-imagen.jpg');`

## 📋 Especificaciones Recomendadas

- **Formato**: JPG, PNG o WEBP
- **Resolución**: Mínimo 1920x1080 (Full HD)
- **Proporción**: 16:9 (paisaje)
- **Peso**: Máximo 2MB para buena carga
- **Contenido**: Escenas agrícolas, campos, trabajadores rurales

## 🎨 Ejemplos de Imágenes Apropiadas

- ✅ Trabajadores en campos de cultivo
- ✅ Tractores y maquinaria agrícola
- ✅ Plantaciones y viñedos
- ✅ Cosecha y agricultura
- ❌ Evitar imágenes muy oscuras o con poco contraste

## 🔧 Ubicación Exacta en el Código

**Archivo**: `css/style.css`  
**Línea**: Busca `.banner-background-image`  
**Propiedad**: `background-image`

```css
.banner-background-image {
    /* ... otras propiedades ... */
    background-image: url('../img/TU_IMAGEN_AQUI.jpg'); /* ← Cambiar aquí */
    /* ... otras propiedades ... */
}
```

## 🌟 Características Aplicadas

- **Imagen a pantalla completa** (100vh)
- **Efecto Ken Burns** (zoom suave)
- **Overlay con degradado** para mejor legibilidad
- **Responsive** (se adapta a móviles y tablets)
- **Background fijo** en desktop
- **Optimización móvil** (sin parallax para mejor rendimiento)

## ⚡ Consejos de Optimización

1. **Comprime la imagen** antes de subirla
2. **Usa formatos modernos** como WebP si es posible
3. **Testa en diferentes dispositivos** después del cambio
4. **Verifica el contraste** con el texto superpuesto

¡Listo! Tu imagen de portada se aplicará automáticamente con todos los efectos profesionales implementados.