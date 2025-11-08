# 📋 Especificación Técnica: Sistema de Gestión de Postulaciones

## 🎯 Objetivo

Implementar un sistema completo de notificaciones y gestión de postulaciones para ofertas de empleo, que permita a las empresas visualizar, rastrear y administrar las solicitudes de empleo recibidas de manera eficiente y con feedback visual en tiempo real.

---

## 📊 Análisis de Requerimientos

### Requerimientos Funcionales

1. **RF-01**: El botón "Ver detalles" debe renombrarse a "Postulaciones"
2. **RF-02**: El botón debe mostrar un badge visual con el contador de postulaciones
3. **RF-03**: Al hacer click en "Postulaciones", debe abrirse un modal con la lista completa de postulantes
4. **RF-04**: Las postulaciones nuevas deben incrementar el contador en la stats-card "Solicitudes"
5. **RF-05**: Debe mostrarse un banner/alert prominente cuando hay postulaciones nuevas
6. **RF-06**: El sistema debe diferenciar entre postulaciones "vistas" y "no vistas"
7. **RF-07**: Los efectos visuales deben resaltar las notificaciones nuevas (pulse, glow, bounce)

### Requerimientos No Funcionales

1. **RNF-01**: Autenticación obligatoria mediante JWT Bearer token
2. **RNF-02**: Manejo robusto de errores HTTP (401, 403, 404, 500)
3. **RNF-03**: Rendimiento: Carga de postulaciones < 2 segundos
4. **RNF-04**: UX: Feedback visual inmediato en todas las acciones
5. **RNF-05**: Accesibilidad: Mensajes en español, interfaz intuitiva
6. **RNF-06**: Persistencia: Estado de "visto/no visto" en localStorage
7. **RNF-07**: Responsividad: Compatible con mobile, tablet, desktop

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD (Usuario Empresa)              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐        ┌──────────────────┐          │
│  │  Stats Card      │        │  Banner Global   │          │
│  │  "Solicitudes"   │        │  Notificaciones  │          │
│  │  [Badge Counter] │        │  [Dismissible]   │          │
│  └──────────────────┘        └──────────────────┘          │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            Ofertas de Empleo (Cards Grid)             │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │  Card Oferta #1                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Título: Cosechador de Vid                        │ │ │
│  │  │ Ubicación: Mendoza                                │ │ │
│  │  │ Período: Nov 2025 - Mar 2026                      │ │ │
│  │  │                                                    │ │ │
│  │  │ [Editar] [🔔 Postulaciones (5)]  ← Badge animado │ │ │
│  │  │           └─────────────┬─────────┘                │ │ │
│  │  └──────────────────────────┼──────────────────────── │ │ │
│  │                             │                          │ │ │
│  │                             ▼                          │ │ │
│  │  ┌───────────────────────────────────────────────────┐│ │
│  │  │        MODAL: Postulaciones - Oferta #1          ││ │
│  │  ├───────────────────────────────────────────────────┤│ │
│  │  │ Header: Postulaciones (5 candidatos)             ││ │
│  │  ├───────────────────────────────────────────────────┤│ │
│  │  │ Body: Tabla de Postulantes                       ││ │
│  │  │ ┌──────┬────────┬──────────┬──────────┬─────────┐││ │
│  │  │ │ DNI  │ Nombre │ Teléfono │ Distrito │  Fecha  │││ │
│  │  │ ├──────┼────────┼──────────┼──────────┼─────────┤││ │
│  │  │ │11... │ Juan P.│ 261-555..│ Luján    │ Hoy     │││ │
│  │  │ │22... │ María G│ 261-444..│ Maipú    │ Ayer    │││ │
│  │  │ └──────┴────────┴──────────┴──────────┴─────────┘││ │
│  │  ├───────────────────────────────────────────────────┤│ │
│  │  │ Footer: [Exportar PDF] [Cerrar]                  ││ │
│  │  └───────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

```
[Usuario Empleado]
       │
       │ POST /publico/postulaciones/registro
       ▼
[Backend API]
       │
       │ Guarda postulación en DB
       ▼
[Usuario Empresa - Dashboard]
       │
       │ GET /privado/postulaciones/oferta/{id}
       ▼
[Frontend - Sistema de Notificaciones]
       │
       ├─► Actualiza badge en card de oferta
       ├─► Incrementa contador en stats-card
       ├─► Muestra banner global (si hay nuevas)
       └─► Persiste estado en localStorage
```

---

## 🔌 API Integration

### Endpoint de Postulaciones

**URL**: `GET /privado/postulaciones/oferta/{id}`

**Autenticación**: Bearer Token (JWT)

**Parámetros**:
- `id` (path): Integer - ID de la oferta de empleo

**Response Success (200)**:
```json
[
  {
    "persona": {
      "idPersona": 1,
      "dni": "11111111",
      "nombre": "Juan",
      "apellido": "Pérez",
      "calle": "San Martín",
      "numeracion": "1234",
      "telefono": "2615554444",
      "latitud": -33.08189,
      "longitud": -68.472291,
      "nombreDistrito": "LA COLONIA",
      "nombreDepartamento": "JUNÍN"
    },
    "fechaPostulacion": "2025-11-06T04:35:06.551866"
  }
]
```

**Response Error (401)**:
```json
{
  "error": "Token inválido o expirado"
}
```

**Response Error (403)**:
```json
{
  "error": "No tiene permisos para ver estas postulaciones"
}
```

**Response Error (404)**:
```json
{
  "error": "Oferta de empleo no encontrada"
}
```

---

## 💾 Estructura de Datos

### LocalStorage Schema

```javascript
// Estructura para tracking de postulaciones vistas
{
  "postulaciones_vistas": {
    "oferta_4": {
      "lastViewed": "2025-11-08T10:30:00Z",
      "viewedPostulaciones": [1, 2, 3],  // IDs de personas
      "totalCount": 5
    },
    "oferta_7": {
      "lastViewed": "2025-11-08T09:15:00Z",
      "viewedPostulaciones": [5, 6],
      "totalCount": 8
    }
  },
  
  // Estado de banner de notificaciones
  "notificaciones_banner": {
    "dismissed": false,
    "lastDismissed": "2025-11-08T08:00:00Z"
  }
}
```

### Estado en Memoria

```javascript
// Variable global para cache de postulaciones
window.postulacionesCache = {
  "4": {
    data: [...],           // Array de postulaciones
    timestamp: 1699437600, // Unix timestamp
    count: 5,
    nuevas: 2              // Contador de no vistas
  }
};

// Contador global agregado
window.totalPostulacionesNuevas = 0;
```

---

## 🎨 Especificación UI/UX

### Badge de Contador en Botón

**Ubicación**: Botón "Postulaciones" en cada card de oferta

**Estados**:
1. **Sin postulaciones** (0): Badge oculto
2. **Con postulaciones vistas** (> 0): Badge azul estático
3. **Con postulaciones nuevas** (> 0): Badge verde pulsante

**HTML Template**:
```html
<button class="btn btn-oferta btn-postulaciones" 
        onclick="abrirModalPostulaciones(${idOferta})"
        data-oferta-id="${idOferta}">
    <i class="fas fa-users me-2"></i>
    Postulaciones
    <span class="badge badge-postulaciones ${hasNuevas ? 'badge-nuevas' : ''}" 
          id="badge-oferta-${idOferta}">
        ${count}
    </span>
</button>
```

**CSS Styles**:
```css
.badge-postulaciones {
    margin-left: 8px;
    font-size: 0.75rem;
    padding: 0.35rem 0.65rem;
    background: #4A90E2;
    border-radius: 12px;
}

.badge-postulaciones.badge-nuevas {
    background: #27AE60;
    animation: badge-pulse 2s ease-in-out infinite;
    box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7);
}

@keyframes badge-pulse {
    0%, 100% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7);
    }
    50% {
        transform: scale(1.1);
        box-shadow: 0 0 0 8px rgba(39, 174, 96, 0);
    }
}
```

### Modal de Postulaciones

**Estructura HTML**:
```html
<div class="modal fade" id="modalPostulaciones" tabindex="-1">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    <i class="fas fa-users me-2"></i>
                    Postulaciones - <span id="modal-oferta-titulo"></span>
                </h5>
                <span class="badge bg-info ms-3" id="modal-total-postulaciones">
                    0 candidatos
                </span>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            
            <div class="modal-body">
                <!-- Loading State -->
                <div id="postulaciones-loading" class="text-center py-5">
                    <div class="spinner-border text-primary"></div>
                    <p class="mt-3">Cargando postulaciones...</p>
                </div>
                
                <!-- Empty State -->
                <div id="postulaciones-empty" class="d-none text-center py-5">
                    <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                    <h6>No hay postulaciones aún</h6>
                    <p class="text-muted">Las postulaciones aparecerán aquí</p>
                </div>
                
                <!-- Error State -->
                <div id="postulaciones-error" class="d-none alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <span id="error-mensaje"></span>
                </div>
                
                <!-- Data Table -->
                <div id="postulaciones-table-container" class="d-none">
                    <div class="table-responsive">
                        <table class="table table-hover table-dark">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>DNI</th>
                                    <th>Nombre Completo</th>
                                    <th>Teléfono</th>
                                    <th>Ubicación</th>
                                    <th>Fecha Postulación</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="postulaciones-tbody">
                                <!-- Filas dinámicas -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn btn-outline-secondary" onclick="exportarPostulacionesPDF()">
                    <i class="fas fa-file-pdf me-2"></i>Exportar PDF
                </button>
                <button class="btn btn-primary" data-bs-dismiss="modal">
                    Cerrar
                </button>
            </div>
        </div>
    </div>
</div>
```

### Banner de Notificaciones Globales

**Ubicación**: Parte superior del dashboard, debajo del header de perfil

**HTML Template**:
```html
<div class="alert alert-postulaciones-nuevas alert-dismissible fade show" 
     id="banner-postulaciones"
     style="display: none;">
    <div class="d-flex align-items-center">
        <i class="fas fa-bell fa-2x text-warning me-3 bell-animated"></i>
        <div class="flex-grow-1">
            <h6 class="alert-heading mb-1">
                ¡Tienes <strong id="banner-count">0</strong> postulaciones nuevas!
            </h6>
            <p class="mb-0 small">
                Revisa las solicitudes de empleo pendientes
            </p>
        </div>
        <button class="btn btn-warning btn-sm me-3" onclick="scrollToOfertas()">
            Ver Ofertas
        </button>
    </div>
    <button type="button" class="btn-close" onclick="dismissBannerPostulaciones()"></button>
</div>
```

**CSS Animations**:
```css
.alert-postulaciones-nuevas {
    background: linear-gradient(135deg, #F39C12 0%, #E67E22 100%);
    border: 2px solid #F39C12;
    color: white;
    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.4);
    animation: slide-down 0.5s ease-out;
}

@keyframes slide-down {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.bell-animated {
    animation: bell-ring 1s ease-in-out infinite;
    transform-origin: top center;
}

@keyframes bell-ring {
    0%, 100% { transform: rotate(0deg); }
    10%, 30% { transform: rotate(14deg); }
    20%, 40% { transform: rotate(-14deg); }
    50% { transform: rotate(0deg); }
}
```

---

## 🔧 Funciones JavaScript Core

### 1. Service Layer

```javascript
/**
 * Obtener postulaciones de una oferta específica
 * @param {number} idOferta - ID de la oferta de empleo
 * @returns {Promise<Array>} Array de postulaciones
 */
async function fetchPostulacionesPorOferta(idOferta) {
    try {
        console.log(`🔄 Obteniendo postulaciones para oferta ${idOferta}...`);
        
        const url = `http://localhost:8080/privado/postulaciones/oferta/${idOferta}`;
        const response = await fetchWithAuth(url);
        
        if (!response.ok) {
            // Manejo específico de errores HTTP
            if (response.status === 401) {
                throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
            } else if (response.status === 403) {
                throw new Error('No tiene permisos para ver estas postulaciones.');
            } else if (response.status === 404) {
                throw new Error('Oferta de empleo no encontrada.');
            } else if (response.status >= 500) {
                throw new Error('Error del servidor. Intente nuevamente más tarde.');
            } else {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
        }
        
        const postulaciones = await response.json();
        console.log(`✅ ${postulaciones.length} postulaciones obtenidas`);
        
        // Actualizar cache
        actualizarCachePostulaciones(idOferta, postulaciones);
        
        return postulaciones;
        
    } catch (error) {
        console.error('❌ Error obteniendo postulaciones:', error);
        throw error;
    }
}
```

### 2. Cache Management

```javascript
/**
 * Actualizar cache de postulaciones
 */
function actualizarCachePostulaciones(idOferta, postulaciones) {
    if (!window.postulacionesCache) {
        window.postulacionesCache = {};
    }
    
    window.postulacionesCache[idOferta] = {
        data: postulaciones,
        timestamp: Date.now(),
        count: postulaciones.length
    };
}

/**
 * Obtener postulaciones desde cache (si está fresco)
 */
function obtenerPostulacionesDesdeCache(idOferta, maxAge = 60000) {
    if (!window.postulacionesCache || !window.postulacionesCache[idOferta]) {
        return null;
    }
    
    const cached = window.postulacionesCache[idOferta];
    const age = Date.now() - cached.timestamp;
    
    if (age > maxAge) {
        console.log('⚠️ Cache expirado, se necesita refresh');
        return null;
    }
    
    console.log('✅ Usando datos desde cache');
    return cached.data;
}
```

### 3. Modal Management

```javascript
/**
 * Abrir modal de postulaciones
 */
async function abrirModalPostulaciones(idOferta) {
    console.log(`🎯 Abriendo modal de postulaciones para oferta ${idOferta}`);
    
    // Obtener datos de la oferta para el título
    const oferta = obtenerDatosOferta(idOferta);
    
    // Actualizar título del modal
    document.getElementById('modal-oferta-titulo').textContent = 
        oferta?.puesto || `Oferta #${idOferta}`;
    
    // Mostrar modal
    const modalElement = document.getElementById('modalPostulaciones');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Mostrar loading state
    mostrarEstadoLoading();
    
    try {
        // Obtener postulaciones
        const postulaciones = await fetchPostulacionesPorOferta(idOferta);
        
        // Renderizar postulaciones
        renderizarPostulaciones(postulaciones);
        
        // Marcar como vistas
        marcarPostulacionesComoVistas(idOferta, postulaciones);
        
        // Actualizar badge de la oferta
        actualizarBadgeOferta(idOferta, postulaciones.length, false);
        
        // Recalcular contador global
        recalcularContadorGlobal();
        
    } catch (error) {
        mostrarEstadoError(error.message);
    }
}
```

### 4. Rendering

```javascript
/**
 * Renderizar tabla de postulaciones
 */
function renderizarPostulaciones(postulaciones) {
    const tbody = document.getElementById('postulaciones-tbody');
    const totalBadge = document.getElementById('modal-total-postulaciones');
    
    // Ocultar loading
    document.getElementById('postulaciones-loading').classList.add('d-none');
    
    if (!postulaciones || postulaciones.length === 0) {
        // Mostrar estado vacío
        document.getElementById('postulaciones-empty').classList.remove('d-none');
        totalBadge.textContent = '0 candidatos';
        return;
    }
    
    // Mostrar tabla
    document.getElementById('postulaciones-table-container').classList.remove('d-none');
    totalBadge.textContent = `${postulaciones.length} candidato${postulaciones.length > 1 ? 's' : ''}`;
    
    // Generar filas
    tbody.innerHTML = postulaciones.map((postulacion, index) => {
        const persona = postulacion.persona;
        const fechaFormateada = formatearFechaPostulacion(postulacion.fechaPostulacion);
        
        return `
            <tr data-persona-id="${persona.idPersona}">
                <td>${index + 1}</td>
                <td>
                    <code class="text-light">${persona.dni}</code>
                </td>
                <td>
                    <strong>${persona.apellido}, ${persona.nombre}</strong>
                </td>
                <td>
                    <a href="tel:${persona.telefono}" class="text-info">
                        <i class="fas fa-phone me-1"></i>${persona.telefono}
                    </a>
                </td>
                <td>
                    <small class="text-muted">
                        <i class="fas fa-map-marker-alt me-1"></i>
                        ${persona.nombreDistrito}, ${persona.nombreDepartamento}
                    </small>
                </td>
                <td>
                    <span class="badge bg-secondary" title="${postulacion.fechaPostulacion}">
                        ${fechaFormateada}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-info" 
                            onclick="verDetallesPostulante(${persona.idPersona})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary" 
                            onclick="verUbicacionMapa(${persona.latitud}, ${persona.longitud})">
                        <i class="fas fa-map"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}
```

### 5. Notification System

```javascript
/**
 * Calcular y mostrar contador global de postulaciones
 */
async function recalcularContadorGlobal() {
    console.log('🔄 Recalculando contador global de postulaciones...');
    
    try {
        // Obtener todas las ofertas vigentes del usuario
        const ofertasVigentes = await obtenerOfertasVigentes();
        
        let totalNuevas = 0;
        let totalPostulaciones = 0;
        
        // Iterar sobre cada oferta
        for (const oferta of ofertasVigentes) {
            const postulaciones = await fetchPostulacionesPorOferta(oferta.idOfertaEmpleo);
            const vistas = obtenerPostulacionesVistas(oferta.idOfertaEmpleo);
            
            totalPostulaciones += postulaciones.length;
            totalNuevas += Math.max(0, postulaciones.length - vistas.length);
        }
        
        // Actualizar stats card
        actualizarStatsCardSolicitudes(totalNuevas);
        
        // Mostrar/ocultar banner
        if (totalNuevas > 0) {
            mostrarBannerPostulaciones(totalNuevas);
        } else {
            ocultarBannerPostulaciones();
        }
        
        console.log(`✅ Total: ${totalPostulaciones} postulaciones, ${totalNuevas} nuevas`);
        
    } catch (error) {
        console.error('❌ Error recalculando contador global:', error);
    }
}
```

---

## ✅ Testing Checklist

### Casos de Prueba

- [ ] **CP-01**: Usuario sin postulaciones ve badge oculto
- [ ] **CP-02**: Usuario con postulaciones ve contador correcto
- [ ] **CP-03**: Click en "Postulaciones" abre modal
- [ ] **CP-04**: Modal muestra tabla con datos completos
- [ ] **CP-05**: Fechas se formatean correctamente
- [ ] **CP-06**: Badge se marca como "visto" después de abrir modal
- [ ] **CP-07**: Banner aparece cuando hay postulaciones nuevas
- [ ] **CP-08**: Banner es dismissible y no vuelve a aparecer
- [ ] **CP-09**: Stats card muestra total correcto
- [ ] **CP-10**: Animaciones funcionan correctamente
- [ ] **CP-11**: Manejo de error 401 redirige a login
- [ ] **CP-12**: Manejo de error 404 muestra mensaje amigable
- [ ] **CP-13**: Cache evita peticiones redundantes
- [ ] **CP-14**: Refresh actualiza contadores
- [ ] **CP-15**: Responsive en mobile/tablet/desktop

---

## 📈 Métricas de Éxito

1. **Performance**: Carga de modal < 2 segundos
2. **Usabilidad**: Usuario encuentra postulaciones en < 3 clicks
3. **Fiabilidad**: 99% de peticiones exitosas
4. **Accesibilidad**: Mensajes claros en todos los estados
5. **UX**: Feedback visual en < 200ms

---

## 🚀 Plan de Implementación

### Fase 1: Backend Integration (1-2 horas)
- Implementar service layer
- Configurar autenticación
- Manejo de errores robusto

### Fase 2: UI Components (2-3 horas)
- Crear modal HTML
- Renombrar botones
- Implementar badges

### Fase 3: Notification System (2-3 horas)
- Sistema de conteo
- Banner global
- Stats card update

### Fase 4: Visual Effects (1 hora)
- Animaciones CSS
- Estados hover/active
- Responsive adjustments

### Fase 5: Testing & Polish (1-2 horas)
- Testing end-to-end
- Bug fixes
- Performance optimization

**Tiempo Total Estimado**: 7-11 horas

---

## 📝 Notas de Implementación

### Consideraciones Técnicas

1. **Autenticación**: Verificar siempre token antes de peticiones
2. **Cache**: Invalidar cache después de 1 minuto
3. **LocalStorage**: Limpiar datos antiguos (> 30 días)
4. **Polling**: Implementar refresh cada 2-3 minutos (opcional)
5. **Error Handling**: Mostrar siempre mensajes user-friendly

### Mejoras Futuras

1. WebSockets para notificaciones en tiempo real
2. Sistema de filtrado de postulaciones
3. Exportar a Excel/CSV además de PDF
4. Vista de mapa con ubicación de postulantes
5. Sistema de mensajería interna
6. Estados de postulación (pendiente/aceptado/rechazado)

---

## 🎓 Referencias Técnicas

- Bootstrap 5 Modal: https://getbootstrap.com/docs/5.0/components/modal/
- Fetch API: https://developer.mozilla.org/es/docs/Web/API/Fetch_API
- LocalStorage: https://developer.mozilla.org/es/docs/Web/API/Window/localStorage
- CSS Animations: https://developer.mozilla.org/es/docs/Web/CSS/CSS_Animations
- JWT Authentication: https://jwt.io/introduction

---

**Versión**: 1.0  
**Fecha**: 2025-11-08  
**Autor**: Sistema de Desarrollo AgroLaboral
