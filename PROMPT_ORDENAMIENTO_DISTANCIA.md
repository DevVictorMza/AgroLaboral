# PROMPT PROFESIONAL - IMPLEMENTACIÓN ORDENAMIENTO POR DISTANCIA

---

## 🎯 CONTEXTO DEL PROYECTO

Estamos desarrollando **AgroLaboral**, una plataforma web para gestión de ofertas de empleo agrícola en Mendoza, Argentina. El sistema cuenta con un backend Spring Boot y un frontend vanilla JavaScript que muestra ofertas públicas de empleo.

---

## 📋 OBJETIVO PRINCIPAL

Implementar dos mejoras críticas en la visualización de ofertas públicas:

1. **Mostrar el nombre de la empresa** en las cards de ofertas (actualmente solo muestra el establecimiento)
2. **Implementar ordenamiento por distancia** usando geolocalización del usuario

---

## 🔧 ESPECIFICACIONES TÉCNICAS

### **Backend Endpoint**

El controlador Spring Boot ya está preparado y retorna ofertas con esta estructura:

**URL:** `http://localhost:8080/publico/ofertas-empleo/vigentes`

**Parámetros opcionales:**
- `puesto` (String): Filtrar por tipo de puesto
- `orden` (String): `"fecha"` (default) o `"distancia"`
- `lat` (Double): Latitud del usuario (requerido si orden=distancia)
- `lon` (Double): Longitud del usuario (requerido si orden=distancia)

**Ejemplo de respuesta JSON:**
```json
[
    {
        "idOfertaEmpleo": 7,
        "nombreEstablecimiento": "Establecimiento Cinco",
        "nombreEmpresa": "Empresa Dos",
        "nombrePuestoTrabajo": "PODADOR/ATADOR",
        "nombreEspecie": null,
        "vacantes": 2,
        "fechaCierre": "2025-11-06",
        "latitud": -33.083356,
        "longitud": -68.473165,
        "distancia": 1.245  // Solo presente cuando orden=distancia
    },
    {
        "idOfertaEmpleo": 5,
        "nombreEstablecimiento": "Establecimiento Tres",
        "nombreEmpresa": "Empresa Uno",
        "nombrePuestoTrabajo": "PODADOR/ATADOR",
        "nombreEspecie": null,
        "vacantes": 2,
        "fechaCierre": "2025-11-07",
        "latitud": -33.085388,
        "longitud": -68.474237,
        "distancia": 1.567
    }
]
```

**Controlador Spring Boot:**
```java
@GetMapping("/vigentes")
public ResponseEntity<List<OfertaEmpleoRespuestaPubDTO>> listarVigentes(
        @RequestParam(required = false) String puesto,
        @RequestParam(required = false, defaultValue = "fecha") String orden,
        @RequestParam(required = false) Double lat,
        @RequestParam(required = false) Double lon) {

    List<OfertaEmpleoRespuestaPubDTO> respuesta =
            servicioOfertaEmpleo.listarVigentesFiltradas(puesto, orden, lat, lon);

    return ResponseEntity.ok(respuesta);
}
```

---

## 📁 ESTRUCTURA DE ARCHIVOS RELEVANTES

```
proyecto cepas laborales/
├── index.html                      # Página principal con filtros y botones
├── css/
│   └── style.css                   # Estilos principales (agregar estilos de ordenamiento)
└── js/
    └── app.js                      # Lógica principal (12,082 líneas)
        ├── cargarOfertasPublicas()         # Línea ~10665
        ├── buildQueryParamsPublico()       # Línea ~10602
        ├── getUbicacionUsuario()           # Línea ~10622
        ├── renderizarOfertasPublicas()     # Línea ~11180
        └── Event Listeners                 # Línea ~11490+
```

---

## 🎨 CAMBIO 1: MOSTRAR NOMBRE DE EMPRESA EN CARDS

### **Ubicación del código**

**Archivo:** `js/app.js`
**Función:** `renderizarOfertasPublicas(ofertas)`
**Línea aproximada:** 11260

### **Código actual (ANTES):**

```javascript
<div class="mb-3">
    <h6 class="fw-bold text-primary">
        <i class="fas fa-building me-1"></i>
        ${oferta.nombreEstablecimiento || 'Establecimiento no especificado'}
    </h6>
</div>
```

### **Código modificado (DESPUÉS):**

```javascript
<div class="mb-3">
    <h6 class="fw-bold text-primary mb-2">
        <i class="fas fa-building me-1"></i>
        ${oferta.nombreEmpresa || 'Empresa no especificada'}
    </h6>
    <p class="text-muted small mb-0">
        <i class="fas fa-map-pin me-1"></i>
        ${oferta.nombreEstablecimiento || 'Establecimiento no especificado'}
    </p>
</div>
```

### **Resultado esperado:**

Las cards ahora mostrarán:
- **Título principal:** Nombre de la empresa (ej: "Empresa Dos")
- **Subtítulo:** Nombre del establecimiento (ej: "Establecimiento Cinco")

---

## 🚀 CAMBIO 2: IMPLEMENTAR ORDENAMIENTO POR DISTANCIA

### **2.1. Habilitar botón en HTML**

**Archivo:** `index.html`
**Línea aproximada:** 732

**ANTES:**
```html
<button type="button" class="btn btn-outline-success flex-fill" id="btn-ordenar-cercania" disabled>
    <i class="fas fa-map-marker-alt me-1"></i>
    Ordenar por cercanía
</button>
```

**DESPUÉS:**
```html
<button type="button" class="btn btn-outline-success flex-fill" id="btn-ordenar-cercania">
    <i class="fas fa-map-marker-alt me-1"></i>
    Ordenar por cercanía
</button>
```

---

### **2.2. Crear función para actualizar indicador visual**

**Archivo:** `js/app.js`
**Ubicación:** Después de `renderizarOfertasPublicas()` (línea ~11400)

```javascript
/**
 * Actualiza el indicador visual de ordenamiento activo
 * @param {string} tipo - Tipo de ordenamiento ('fecha', 'distancia', null)
 */
function actualizarIndicadorOrdenamiento(tipo) {
    const indicador = document.getElementById('ordenamiento-info');
    if (!indicador) return;
    
    if (!tipo) {
        indicador.classList.add('ordenamiento-info-hidden');
        indicador.innerHTML = '';
        return;
    }
    
    indicador.classList.remove('ordenamiento-info-hidden');
    
    if (tipo === 'fecha') {
        indicador.innerHTML = `
            <i class="fas fa-calendar-alt me-1"></i>
            <strong>Ordenado por fecha de cierre</strong> - Las ofertas más recientes aparecen primero
        `;
    } else if (tipo === 'distancia') {
        indicador.innerHTML = `
            <i class="fas fa-location-arrow me-1 text-success"></i>
            <strong>Ordenado por distancia</strong> - Las ofertas más cercanas a tu ubicación aparecen primero
        `;
    }
}
```

---

### **2.3. Modificar event listener del botón "Ordenar por cercanía"**

**Archivo:** `js/app.js`
**Línea aproximada:** 11519

**ANTES:**
```javascript
const btnOrdenarCercania = document.getElementById('btn-ordenar-cercania');
if (btnOrdenarCercania) {
    btnOrdenarCercania.addEventListener('click', async function() {
        const tipoActual = window.estadoOrdenamiento.tipo;
        
        if (tipoActual === 'cercania') {
            aplicarOrdenamiento(null);
        } else {
            aplicarOrdenamiento('cercania');
        }
    });
    
    if (esDesarrollo()) {
        console.log('✅ Event listener de ordenar por cercanía configurado');
    }
}
```

**DESPUÉS:**
```javascript
const btnOrdenarCercania = document.getElementById('btn-ordenar-cercania');
if (btnOrdenarCercania) {
    btnOrdenarCercania.addEventListener('click', async function() {
        try {
            // Mostrar indicador de carga
            btnOrdenarCercania.disabled = true;
            btnOrdenarCercania.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2"></span>
                Obteniendo ubicación...
            `;
            
            // Solicitar ubicación del usuario
            const coords = await getUbicacionUsuario();
            
            console.log('📍 Ubicación obtenida:', coords);
            
            // Obtener filtro actual de puesto
            const selectorPuesto = document.getElementById('filtro-puesto-publico');
            const puestoActual = selectorPuesto ? selectorPuesto.value : '';
            
            // Cargar ofertas ordenadas por distancia
            await cargarOfertasPublicas({ 
                orden: 'distancia',
                puesto: puestoActual
            });
            
            // Actualizar estado de los botones
            btnOrdenarCercania.classList.add('active');
            document.getElementById('btn-ordenar-fecha')?.classList.remove('active');
            
            btnOrdenarCercania.innerHTML = `
                <i class="fas fa-map-marker-alt me-1"></i>
                Ordenado por cercanía
                <i class="fas fa-check ms-1"></i>
            `;
            
            // Actualizar indicador
            actualizarIndicadorOrdenamiento('distancia');
            
        } catch (error) {
            console.error('❌ Error al ordenar por cercanía:', error);
            
            // Mostrar mensaje de error amigable
            alert('No se pudo obtener tu ubicación. Por favor, permite el acceso a tu ubicación para usar esta función.');
            
            // Restaurar botón
            btnOrdenarCercania.innerHTML = `
                <i class="fas fa-map-marker-alt me-1"></i>
                Ordenar por cercanía
            `;
        } finally {
            btnOrdenarCercania.disabled = false;
        }
    });
    
    if (esDesarrollo()) {
        console.log('✅ Event listener de ordenar por cercanía configurado');
    }
}
```

---

### **2.4. Modificar event listener del botón "Ordenar por fecha"**

**Archivo:** `js/app.js`
**Línea aproximada:** 11494

**ANTES:**
```javascript
const btnOrdenarFecha = document.getElementById('btn-ordenar-fecha');
if (btnOrdenarFecha) {
    btnOrdenarFecha.addEventListener('click', function() {
        const tipoActual = window.estadoOrdenamiento.tipo;
        
        if (tipoActual === 'fecha') {
            aplicarOrdenamiento('fecha');
        } else {
            aplicarOrdenamiento('fecha');
        }
    });
    
    if (esDesarrollo()) {
        console.log('✅ Event listener de ordenar por fecha configurado');
    }
}
```

**DESPUÉS:**
```javascript
const btnOrdenarFecha = document.getElementById('btn-ordenar-fecha');
if (btnOrdenarFecha) {
    btnOrdenarFecha.addEventListener('click', async function() {
        try {
            // Obtener filtro actual de puesto
            const selectorPuesto = document.getElementById('filtro-puesto-publico');
            const puestoActual = selectorPuesto ? selectorPuesto.value : '';
            
            // Cargar ofertas ordenadas por fecha (por defecto)
            await cargarOfertasPublicas({ 
                orden: 'fecha',
                puesto: puestoActual
            });
            
            // Actualizar estado de los botones
            btnOrdenarFecha.classList.add('active');
            document.getElementById('btn-ordenar-cercania')?.classList.remove('active');
            
            // Restaurar texto del botón cercanía
            const btnCercania = document.getElementById('btn-ordenar-cercania');
            if (btnCercania) {
                btnCercania.innerHTML = `
                    <i class="fas fa-map-marker-alt me-1"></i>
                    Ordenar por cercanía
                `;
            }
            
            // Actualizar indicador
            actualizarIndicadorOrdenamiento('fecha');
            
            console.log('📅 Ofertas ordenadas por fecha');
            
        } catch (error) {
            console.error('❌ Error al ordenar por fecha:', error);
        }
    });
    
    if (esDesarrollo()) {
        console.log('✅ Event listener de ordenar por fecha configurado');
    }
}
```

---

### **2.5. Modificar función "Limpiar filtros"**

**Archivo:** `js/app.js`
**Event Listener:** `btn-limpiar-filtros`
**Línea aproximada:** 11540

Agregar el siguiente código **DENTRO** del event listener existente, después de resetear los filtros:

```javascript
// Resetear botones de ordenamiento
document.getElementById('btn-ordenar-fecha')?.classList.remove('active');
document.getElementById('btn-ordenar-cercania')?.classList.remove('active');

// Restaurar texto de botón cercanía
const btnCercania = document.getElementById('btn-ordenar-cercania');
if (btnCercania) {
    btnCercania.innerHTML = `
        <i class="fas fa-map-marker-alt me-1"></i>
        Ordenar por cercanía
    `;
}

// Ocultar indicador de ordenamiento
actualizarIndicadorOrdenamiento(null);

// Cargar ofertas sin ordenamiento específico (por defecto: fecha)
await cargarOfertasPublicas({ 
    puesto: '',
    orden: 'fecha'
});
```

---

### **2.6. Agregar estilos CSS**

**Archivo:** `css/style.css`
**Ubicación:** Al final del archivo

```css
/* ========================================
   ESTILOS DE ORDENAMIENTO DE OFERTAS
   ======================================== */

/* Botones de ordenamiento */
#btn-ordenar-fecha,
#btn-ordenar-cercania {
    transition: all 0.3s ease;
    position: relative;
}

#btn-ordenar-fecha.active,
#btn-ordenar-cercania.active {
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

#btn-ordenar-fecha.active {
    background-color: var(--primary-blue, #4A90E2);
    color: white;
    border-color: var(--primary-blue, #4A90E2);
}

#btn-ordenar-cercania.active {
    background-color: var(--success-green, #27AE60);
    color: white;
    border-color: var(--success-green, #27AE60);
}

/* Indicador de ordenamiento */
#ordenamiento-info {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    background: rgba(74, 144, 226, 0.1);
    border-left: 4px solid var(--primary-blue, #4A90E2);
    transition: all 0.3s ease;
    margin-top: 0.5rem;
}

#ordenamiento-info.ordenamiento-info-hidden {
    display: none;
}

#ordenamiento-info i {
    color: var(--primary-blue, #4A90E2);
}

#ordenamiento-info strong {
    color: var(--text-light, #FFFFFF);
}

/* Spinner para botón de cercanía */
.spinner-border-sm {
    width: 1rem;
    height: 1rem;
    border-width: 0.15em;
}
```

---

## 🔍 VERIFICACIÓN DE FUNCIONAMIENTO CORRECTO

### **Función `buildQueryParamsPublico()` - VERIFICAR QUE EXISTA**

La función en `js/app.js` (línea ~10602) debe incluir esta lógica:

```javascript
function buildQueryParamsPublico(filtros = {}) {
    const params = new URLSearchParams();
    
    if (filtros.puesto && filtros.puesto.trim()) {
        params.append('puesto', filtros.puesto.trim());
    }
    
    if (filtros.orden) {
        params.append('orden', filtros.orden);
    }
    
    // ESTA PARTE ES CRÍTICA - debe agregar lat/lon cuando orden=distancia
    if (filtros.orden === 'distancia' && estadoOfertasPublicas.ubicacion.lat && estadoOfertasPublicas.ubicacion.lon) {
        params.append('lat', estadoOfertasPublicas.ubicacion.lat.toString());
        params.append('lon', estadoOfertasPublicas.ubicacion.lon.toString());
    }
    
    return params.toString();
}
```

**Si esta función NO incluye la lógica de lat/lon, agrégala.**

---

### **Función `getUbicacionUsuario()` - VERIFICAR QUE EXISTA**

La función en `js/app.js` (línea ~10622) debe existir:

```javascript
function getUbicacionUsuario() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocalización no soportada por este navegador'));
            return;
        }
        
        const opciones = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutos
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                estadoOfertasPublicas.ubicacion = {
                    ...coords,
                    disponible: true
                };
                resolve(coords);
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                estadoOfertasPublicas.ubicacion.disponible = false;
                reject(error);
            },
            opciones
        );
    });
}
```

**Si esta función NO existe, créala antes de los event listeners.**

---

## ✅ TESTING Y VALIDACIÓN

### **Test 1: Nombre de empresa en cards**
1. Abrir `http://localhost:3000`
2. Verificar que las cards muestren:
   - **Título grande:** Nombre de la empresa (ej: "Empresa Dos")
   - **Subtítulo pequeño:** Nombre del establecimiento (ej: "Establecimiento Cinco")

**Resultado esperado:** ✅ Cards muestran empresa + establecimiento

---

### **Test 2: Ordenamiento por fecha**
1. Click en "Ordenar por fecha"
2. Verificar en DevTools (Network tab):
   - URL: `http://localhost:8080/publico/ofertas-empleo/vigentes?orden=fecha`
3. Verificar:
   - Botón "Ordenar por fecha" se marca como activo (azul)
   - Aparece indicador: "Ordenado por fecha de cierre"
   - Ofertas se ordenan correctamente

**Resultado esperado:** ✅ Ordenamiento por fecha funcional

---

### **Test 3: Ordenamiento por distancia**
1. Click en "Ordenar por cercanía"
2. Aceptar permisos de ubicación
3. Verificar:
   - Aparece spinner: "Obteniendo ubicación..."
   - En DevTools (Console): Log `📍 Ubicación obtenida: {lat: X, lon: Y}`
   - En DevTools (Network tab): URL incluye `orden=distancia&lat=-33.080330&lon=-68.470203`
4. Verificar:
   - Botón cambia a: "Ordenado por cercanía ✓" (verde)
   - Aparece indicador: "Ordenado por distancia - Las ofertas más cercanas..."
   - Ofertas se reordenan (las más cercanas primero)

**Resultado esperado:** ✅ Ordenamiento por distancia funcional

---

### **Test 4: Alternancia entre ordenamientos**
1. Ordenar por fecha
2. Cambiar a ordenar por cercanía
3. Volver a ordenar por fecha
4. Verificar:
   - Solo un botón está activo a la vez
   - El indicador se actualiza correctamente
   - El botón inactivo vuelve a su texto original

**Resultado esperado:** ✅ Alternancia fluida

---

### **Test 5: Combinación con filtros**
1. Seleccionar puesto: "PODADOR/ATADOR"
2. Click en "Ordenar por cercanía"
3. Verificar en DevTools:
   - URL: `...?puesto=PODADOR%2FATADOR&orden=distancia&lat=X&lon=Y`
4. Verificar que solo se muestren ofertas de ese puesto, ordenadas por distancia

**Resultado esperado:** ✅ Filtros y ordenamiento funcionan juntos

---

### **Test 6: Limpiar filtros**
1. Aplicar filtro de puesto
2. Ordenar por cercanía
3. Click en "Limpiar filtros"
4. Verificar:
   - Filtro de puesto vuelve a "Todos los puestos"
   - Botón de cercanía vuelve a "Ordenar por cercanía" (sin check)
   - Indicador de ordenamiento se oculta
   - Ofertas vuelven a orden por fecha

**Resultado esperado:** ✅ Reset completo funcional

---

### **Test 7: Error de geolocalización**
1. Denegar permisos de ubicación
2. Click en "Ordenar por cercanía"
3. Verificar:
   - Alert: "No se pudo obtener tu ubicación..."
   - Botón vuelve a "Ordenar por cercanía"
   - No hay errores en consola

**Resultado esperado:** ✅ Manejo de errores correcto

---

## 🎯 RESULTADO FINAL ESPERADO

### **Comportamiento por defecto (al cargar la página):**
- Ofertas ordenadas por fecha de cierre (más recientes primero)
- Botón "Ordenar por fecha" SIN marcar como activo
- Botón "Ordenar por cercanía" habilitado y clickeable
- Sin indicador de ordenamiento visible

### **Al hacer click en "Ordenar por fecha":**
- Endpoint: `...?orden=fecha`
- Botón se marca como activo (azul)
- Indicador: "Ordenado por fecha de cierre"
- Cards muestran: **Empresa** (título) + Establecimiento (subtítulo)

### **Al hacer click en "Ordenar por cercanía":**
- Solicita permisos de ubicación
- Muestra spinner mientras obtiene ubicación
- Endpoint: `...?orden=distancia&lat=-33.080330&lon=-68.470203`
- Botón se marca como activo (verde): "Ordenado por cercanía ✓"
- Indicador: "Ordenado por distancia - Las ofertas más cercanas..."
- Cards muestran distancia si está disponible en la respuesta

### **Consola de desarrollador:**
```
📍 Ubicación obtenida: {lat: -33.080330, lon: -68.470203}
🌐 Cargando ofertas públicas desde: http://localhost:8080/publico/ofertas-empleo/vigentes?orden=distancia&lat=-33.080330&lon=-68.470203
✅ Ofertas públicas cargadas: 4
```

---

## 🚨 PUNTOS CRÍTICOS A VERIFICAR

1. ✅ **Función `getUbicacionUsuario()` existe** en `js/app.js`
2. ✅ **Función `buildQueryParamsPublico()` incluye lógica de lat/lon**
3. ✅ **Estado global `estadoOfertasPublicas.ubicacion` se actualiza correctamente**
4. ✅ **Event listeners se registran correctamente** (verificar con `console.log`)
5. ✅ **Permisos de ubicación se solicitan** (navegador muestra popup)
6. ✅ **URL del fetch incluye parámetros correctos** (verificar en Network tab)
7. ✅ **Backend retorna ofertas con campo `distancia`** cuando orden=distancia

---

## 📝 NOTAS ADICIONALES

- **Timeout de geolocalización:** 10 segundos
- **Precisión:** `enableHighAccuracy: true`
- **Cache de ubicación:** 5 minutos (`maximumAge: 300000`)
- **Variables CSS usadas:**
  - `--primary-blue: #4A90E2`
  - `--success-green: #27AE60`
  - `--text-light: #FFFFFF`

---

**DOCUMENTO CREADO:** 07/11/2025
**VERSIÓN:** 1.0
**ESTADO:** Listo para implementación ✅
