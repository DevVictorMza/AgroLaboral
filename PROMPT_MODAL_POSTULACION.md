# PROMPT PROFESIONAL: Sistema de Postulación con Geolocalización

## 🎯 CONTEXTO DEL PROYECTO

**Proyecto**: AgroLaboral - Plataforma de conexión entre empresas agrícolas y trabajadores  
**Stack Tecnológico**: 
- **Frontend**: Vanilla JavaScript (ES6+), Bootstrap 5, Leaflet.js
- **Backend**: Spring Boot (Java)
- **Base de Datos**: PostgreSQL/MySQL
- **Autenticación**: JWT (no requerida para postulaciones)

**Estado Actual**: Sistema funcional con ofertas laborales públicas que muestran botones "Postularse". Actualmente el botón muestra un alert placeholder. Necesitamos implementar un modal completo de postulación.

---

## 📋 REQUERIMIENTOS FUNCIONALES

### RF-01: Modal de Postulación
**Descripción**: Al hacer click en el botón "Postularse" de cualquier oferta laboral, debe abrirse un modal Bootstrap 5 con:
- Formulario de datos personales del postulante
- Mapa interactivo Leaflet para marcar ubicación
- Validación completa de datos
- Envío al backend mediante API REST

**Criterios de Aceptación**:
- ✅ Modal abre correctamente al click en "Postularse"
- ✅ Modal es responsive (mobile-first)
- ✅ Modal mantiene tema oscuro consistente con el sistema
- ✅ Modal captura correctamente el ID de la oferta
- ✅ Modal se puede cerrar sin pérdida de datos (confirmación)

---

### RF-02: Formulario de Datos Personales
**Descripción**: Formulario completo con campos validados para capturar información del postulante.

**Campos Requeridos**:

| Campo | Tipo | Validación | Ejemplo |
|-------|------|------------|---------|
| DNI | text | 7-8 dígitos numéricos, sin puntos | `12345678` |
| Apellido | text | Min 2 caracteres, solo letras y espacios | `González` |
| Nombre | text | Min 2 caracteres, solo letras y espacios | `Juan Carlos` |
| Calle | text | Min 3 caracteres | `San Martín` |
| Numeración | text | Numérico positivo | `1234` |
| Código Postal | text | Exactamente 4 dígitos | `5500` |
| Departamento | select | Requerido, carga dinámica desde API | `Capital` |
| Distrito | select | Requerido, depende de departamento seleccionado | `Ciudad` |
| Latitud | text | Readonly, autocompletado desde mapa, formato decimal | `-32.889458` |
| Longitud | text | Readonly, autocompletado desde mapa, formato decimal | `-68.845839` |
| Teléfono | tel | Formato internacional/nacional | `+54 261 123-4567` |

**Validación HTML5**:
```html
<input type="text" 
       id="dni-postulacion" 
       name="dni" 
       pattern="[0-9]{7,8}" 
       required 
       class="form-control"
       placeholder="Sin puntos ni guiones"
       maxlength="8">
```

**Validación JavaScript**:
```javascript
function validarDNI(dni) {
    const regex = /^[0-9]{7,8}$/;
    return regex.test(dni.trim());
}
```

**Criterios de Aceptación**:
- ✅ Todos los campos tienen validación HTML5
- ✅ Validación JavaScript adicional para casos complejos
- ✅ Feedback visual inmediato (border rojo/verde)
- ✅ Mensajes de error descriptivos en español
- ✅ Focus automático en primer campo con error
- ✅ Campos readonly (lat/lng) no editables manualmente

---

### RF-03: Integración de APIs Públicas

#### API-01: Departamentos
**Endpoint**: `GET http://localhost:8080/publico/departamentos`  
**Autenticación**: No requerida (endpoint público)  
**Respuesta Esperada**:
```json
[
    {
        "idDepartamento": 1,
        "nombreDepartamento": "Capital"
    },
    {
        "idDepartamento": 2,
        "nombreDepartamento": "Godoy Cruz"
    },
    {
        "idDepartamento": 3,
        "nombreDepartamento": "Las Heras"
    }
]
```

**Implementación**:
```javascript
async function cargarDepartamentosPostulacion() {
    try {
        console.log('🔄 Cargando departamentos...');
        
        const response = await fetch('http://localhost:8080/publico/departamentos', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const departamentos = await response.json();
        console.log(`✅ ${departamentos.length} departamentos cargados`);
        
        const selectDepartamento = document.getElementById('departamento-postulacion');
        selectDepartamento.innerHTML = '<option value="">Seleccione un departamento</option>';
        
        departamentos.forEach(dep => {
            const option = document.createElement('option');
            option.value = dep.idDepartamento;
            option.textContent = dep.nombreDepartamento;
            selectDepartamento.appendChild(option);
        });
        
        return departamentos;
        
    } catch (error) {
        console.error('❌ Error cargando departamentos:', error);
        showMessage('Error al cargar departamentos. Por favor, recargue la página.', 'error');
        throw error;
    }
}
```

#### API-02: Distritos (por Departamento)
**Endpoint**: `GET http://localhost:8080/publico/distritos/{idDepartamento}`  
**Autenticación**: No requerida  
**Parámetros**: `idDepartamento` (Number)  
**Respuesta Esperada**:
```json
[
    {
        "idDistrito": 1,
        "nombreDistrito": "Ciudad",
        "departamento": {
            "idDepartamento": 1,
            "nombreDepartamento": "Capital"
        }
    },
    {
        "idDistrito": 2,
        "nombreDistrito": "Primera Sección",
        "departamento": {
            "idDepartamento": 1,
            "nombreDepartamento": "Capital"
        }
    }
]
```

**Implementación**:
```javascript
async function cargarDistritosPostulacion(idDepartamento) {
    if (!idDepartamento) {
        console.warn('⚠️ ID de departamento no proporcionado');
        return;
    }
    
    try {
        console.log(`🔄 Cargando distritos para departamento ${idDepartamento}...`);
        
        const selectDistrito = document.getElementById('distrito-postulacion');
        selectDistrito.innerHTML = '<option value="">Cargando...</option>';
        selectDistrito.disabled = true;
        
        const response = await fetch(`http://localhost:8080/publico/distritos/${idDepartamento}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const distritos = await response.json();
        console.log(`✅ ${distritos.length} distritos cargados`);
        
        selectDistrito.innerHTML = '<option value="">Seleccione un distrito</option>';
        
        if (distritos.length === 0) {
            selectDistrito.innerHTML = '<option value="">Sin distritos disponibles</option>';
            return;
        }
        
        distritos.forEach(dist => {
            const option = document.createElement('option');
            option.value = dist.idDistrito;
            option.textContent = dist.nombreDistrito;
            selectDistrito.appendChild(option);
        });
        
        selectDistrito.disabled = false;
        
    } catch (error) {
        console.error('❌ Error cargando distritos:', error);
        const selectDistrito = document.getElementById('distrito-postulacion');
        selectDistrito.innerHTML = '<option value="">Error al cargar distritos</option>';
        showMessage('Error al cargar distritos. Intente nuevamente.', 'error');
    }
}
```

**Event Listener**:
```javascript
document.getElementById('departamento-postulacion').addEventListener('change', function(e) {
    const idDepartamento = e.target.value;
    
    // Limpiar distrito al cambiar departamento
    const selectDistrito = document.getElementById('distrito-postulacion');
    selectDistrito.innerHTML = '<option value="">Seleccione primero un departamento</option>';
    selectDistrito.disabled = true;
    
    // Cargar distritos si hay departamento seleccionado
    if (idDepartamento) {
        cargarDistritosPostulacion(idDepartamento);
    }
});
```

**Criterios de Aceptación**:
- ✅ Departamentos se cargan automáticamente al abrir modal
- ✅ Select de distritos está deshabilitado hasta elegir departamento
- ✅ Distritos se cargan dinámicamente al seleccionar departamento
- ✅ Al cambiar departamento, los distritos se limpian y recargan
- ✅ Manejo robusto de errores (red caída, timeout, 500, etc.)
- ✅ Loading states durante carga
- ✅ Mensajes de error claros al usuario

---

### RF-04: Mapa Interactivo Leaflet

**Descripción**: Mapa interactivo que permite al usuario marcar su ubicación haciendo click o arrastrando un marcador.

**Configuración Base**:
```javascript
// Variable global para el mapa
let mapaPostulacion = null;
let marcadorPostulacion = null;

function inicializarMapaPostulacion() {
    console.log('🗺️ Inicializando mapa de postulación...');
    
    // Destruir instancia previa si existe
    if (mapaPostulacion) {
        mapaPostulacion.remove();
        mapaPostulacion = null;
        marcadorPostulacion = null;
    }
    
    // Coordenadas de Mendoza, Argentina
    const mendozaLat = -32.8895;
    const mendozaLng = -68.8458;
    
    // Inicializar mapa
    mapaPostulacion = L.map('mapa-postulacion').setView([mendozaLat, mendozaLng], 13);
    
    // Agregar tiles de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 10
    }).addTo(mapaPostulacion);
    
    // Event listener para click en el mapa
    mapaPostulacion.on('click', function(e) {
        colocarMarcadorPostulacion(e.latlng.lat, e.latlng.lng);
    });
    
    // Invalidar tamaño después de un breve delay (fix común de Leaflet en modales)
    setTimeout(() => {
        mapaPostulacion.invalidateSize();
    }, 300);
    
    console.log('✅ Mapa inicializado correctamente');
}
```

**Colocación de Marcador**:
```javascript
function colocarMarcadorPostulacion(lat, lng) {
    console.log(`📍 Colocando marcador en: ${lat}, ${lng}`);
    
    // Remover marcador previo si existe
    if (marcadorPostulacion) {
        mapaPostulacion.removeLayer(marcadorPostulacion);
    }
    
    // Crear nuevo marcador draggable
    marcadorPostulacion = L.marker([lat, lng], {
        draggable: true,
        autoPan: true
    }).addTo(mapaPostulacion);
    
    // Popup con coordenadas
    marcadorPostulacion.bindPopup(`
        <div style="text-align: center;">
            <strong>Ubicación Seleccionada</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}
        </div>
    `).openPopup();
    
    // Actualizar campos del formulario
    document.getElementById('latitud-postulacion').value = lat.toFixed(6);
    document.getElementById('longitud-postulacion').value = lng.toFixed(6);
    
    // Event listener para drag del marcador
    marcadorPostulacion.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        colocarMarcadorPostulacion(pos.lat, pos.lng);
    });
    
    // Centrar mapa en marcador
    mapaPostulacion.panTo([lat, lng]);
}
```

**Geolocalización del Navegador** (Feature Adicional):
```javascript
function obtenerUbicacionActual() {
    if (!navigator.geolocation) {
        showMessage('Geolocalización no soportada en este navegador', 'warning');
        return;
    }
    
    console.log('📍 Solicitando ubicación actual...');
    showMessage('Obteniendo su ubicación...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            console.log(`✅ Ubicación obtenida: ${lat}, ${lng}`);
            colocarMarcadorPostulacion(lat, lng);
            mapaPostulacion.setView([lat, lng], 15);
            showMessage('Ubicación obtenida correctamente', 'success');
        },
        function(error) {
            console.error('❌ Error obteniendo ubicación:', error);
            let mensaje = 'No se pudo obtener su ubicación';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje = 'Permiso de ubicación denegado';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje = 'Ubicación no disponible';
                    break;
                case error.TIMEOUT:
                    mensaje = 'Tiempo de espera agotado';
                    break;
            }
            
            showMessage(mensaje, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}
```

**HTML del Contenedor**:
```html
<div class="position-relative">
    <div id="mapa-postulacion" style="height: 450px; border-radius: 8px;"></div>
    <button type="button" 
            class="btn btn-sm btn-primary position-absolute top-0 end-0 m-2" 
            onclick="obtenerUbicacionActual()"
            style="z-index: 1000;">
        <i class="fas fa-crosshairs me-1"></i>
        Usar mi ubicación
    </button>
</div>
```

**Criterios de Aceptación**:
- ✅ Mapa se renderiza correctamente dentro del modal
- ✅ Click en mapa coloca un marcador
- ✅ Solo un marcador puede existir a la vez
- ✅ Marcador es draggable (arrastrable)
- ✅ Al mover marcador, se actualizan lat/lng automáticamente
- ✅ Popup muestra coordenadas actuales
- ✅ Botón "Usar mi ubicación" solicita permiso y centra mapa
- ✅ Mapa se destruye correctamente al cerrar modal
- ✅ Fix de Leaflet en modales (`invalidateSize()`) aplicado

---

### RF-05: Validación Completa del Formulario

**Validación en Tiempo Real**:
```javascript
function configurarValidacionEnTiempoReal() {
    const form = document.getElementById('form-postulacion');
    const campos = form.querySelectorAll('input, select');
    
    campos.forEach(campo => {
        // Validar al perder foco
        campo.addEventListener('blur', function() {
            validarCampo(this);
        });
        
        // Validar al escribir (solo para inputs)
        if (campo.tagName === 'INPUT') {
            campo.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    validarCampo(this);
                }
            });
        }
    });
}

function validarCampo(campo) {
    const valor = campo.value.trim();
    const nombre = campo.name;
    let esValido = true;
    let mensajeError = '';
    
    // Validación específica por campo
    switch(nombre) {
        case 'dni':
            esValido = /^[0-9]{7,8}$/.test(valor);
            mensajeError = 'DNI debe tener 7 u 8 dígitos';
            break;
            
        case 'apellido':
        case 'nombre':
            esValido = valor.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(valor);
            mensajeError = `${nombre.charAt(0).toUpperCase() + nombre.slice(1)} debe tener al menos 2 letras`;
            break;
            
        case 'calle':
            esValido = valor.length >= 3;
            mensajeError = 'Calle debe tener al menos 3 caracteres';
            break;
            
        case 'numeracion':
            esValido = /^[0-9]+$/.test(valor) && parseInt(valor) > 0;
            mensajeError = 'Numeración debe ser un número positivo';
            break;
            
        case 'codigoPostal':
            esValido = /^[0-9]{4}$/.test(valor);
            mensajeError = 'Código postal debe tener 4 dígitos';
            break;
            
        case 'departamento':
        case 'distrito':
            esValido = valor !== '';
            mensajeError = `Debe seleccionar un ${nombre}`;
            break;
            
        case 'latitud':
        case 'longitud':
            esValido = valor !== '' && !isNaN(parseFloat(valor));
            mensajeError = 'Debe marcar su ubicación en el mapa';
            break;
            
        case 'telefono':
            esValido = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(valor);
            mensajeError = 'Formato de teléfono inválido';
            break;
            
        default:
            esValido = campo.checkValidity();
            mensajeError = 'Campo inválido';
    }
    
    // Aplicar clases de validación
    if (esValido) {
        campo.classList.remove('is-invalid');
        campo.classList.add('is-valid');
        const feedback = campo.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.style.display = 'none';
        }
    } else {
        campo.classList.remove('is-valid');
        campo.classList.add('is-invalid');
        
        // Mostrar mensaje de error
        let feedback = campo.nextElementSibling;
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            campo.parentNode.insertBefore(feedback, campo.nextSibling);
        }
        feedback.textContent = mensajeError;
        feedback.style.display = 'block';
    }
    
    return esValido;
}

function validarFormularioCompleto() {
    const form = document.getElementById('form-postulacion');
    const campos = form.querySelectorAll('input:not([readonly]), select');
    
    let formularioValido = true;
    let primerCampoInvalido = null;
    
    campos.forEach(campo => {
        const esValido = validarCampo(campo);
        if (!esValido) {
            formularioValido = false;
            if (!primerCampoInvalido) {
                primerCampoInvalido = campo;
            }
        }
    });
    
    // Scroll al primer campo con error
    if (primerCampoInvalido) {
        primerCampoInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
        primerCampoInvalido.focus();
    }
    
    return formularioValido;
}
```

**Criterios de Aceptación**:
- ✅ Validación se ejecuta en tiempo real (blur + input)
- ✅ Feedback visual inmediato (border rojo/verde)
- ✅ Mensajes de error descriptivos en español
- ✅ Scroll automático al primer error
- ✅ No permite envío si hay errores
- ✅ Validaciones específicas para cada campo

---

### RF-06: Envío de Postulación al Backend

**Construcción del Objeto de Datos**:
```javascript
function construirDatosPostulacion() {
    const form = document.getElementById('form-postulacion');
    const formData = new FormData(form);
    
    const datos = {
        idOferta: parseInt(window.ofertaActual), // ID guardado al abrir modal
        dni: formData.get('dni').trim(),
        apellido: formData.get('apellido').trim(),
        nombre: formData.get('nombre').trim(),
        domicilio: {
            calle: formData.get('calle').trim(),
            numeracion: formData.get('numeracion').trim(),
            codigoPostal: formData.get('codigoPostal').trim(),
            departamento: {
                idDepartamento: parseInt(formData.get('departamento'))
            },
            distrito: {
                idDistrito: parseInt(formData.get('distrito'))
            },
            latitud: parseFloat(formData.get('latitud')),
            longitud: parseFloat(formData.get('longitud'))
        },
        telefono: formData.get('telefono').trim()
    };
    
    console.log('📦 Datos de postulación construidos:', datos);
    return datos;
}
```

**Función de Envío**:
```javascript
async function enviarPostulacion() {
    console.log('🚀 Iniciando envío de postulación...');
    
    // 1. Validar formulario
    if (!validarFormularioCompleto()) {
        showMessage('Por favor, corrija los errores en el formulario', 'error');
        return;
    }
    
    // 2. Construir datos
    const datos = construirDatosPostulacion();
    
    // 3. Mostrar loading
    const btnEnviar = document.getElementById('btn-enviar-postulacion');
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Enviando...
    `;
    
    try {
        console.log('📡 Enviando POST a /publico/postulaciones...');
        
        const response = await fetch('http://localhost:8080/publico/postulaciones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        console.log(`📡 Respuesta recibida: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            // Intentar parsear mensaje de error del backend
            let errorMsg = 'Error al enviar la postulación';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorData.error || errorMsg;
            } catch (e) {
                // Si no se puede parsear, usar mensaje genérico
            }
            
            // Errores específicos
            if (response.status === 400) {
                throw new Error(`Datos inválidos: ${errorMsg}`);
            } else if (response.status === 409) {
                throw new Error('Ya existe una postulación suya para esta oferta');
            } else if (response.status === 404) {
                throw new Error('La oferta no existe o fue eliminada');
            } else {
                throw new Error(errorMsg);
            }
        }
        
        const resultado = await response.json();
        console.log('✅ Postulación enviada exitosamente:', resultado);
        
        // Mostrar mensaje de éxito
        showMessage('¡Postulación enviada exitosamente! La empresa se pondrá en contacto.', 'success');
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
            cerrarModalPostulacion();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error enviando postulación:', error);
        showMessage(error.message || 'Error al enviar la postulación. Intente nuevamente.', 'error');
        
        // Restaurar botón
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
    }
}
```

**Función para Cerrar Modal**:
```javascript
function cerrarModalPostulacion() {
    const modalElement = document.getElementById('modalPostulacion');
    const modal = bootstrap.Modal.getInstance(modalElement);
    
    if (modal) {
        modal.hide();
    }
    
    // Limpiar formulario
    document.getElementById('form-postulacion').reset();
    
    // Destruir mapa
    if (mapaPostulacion) {
        mapaPostulacion.remove();
        mapaPostulacion = null;
        marcadorPostulacion = null;
    }
    
    // Limpiar variable global
    window.ofertaActual = null;
}
```

**Criterios de Aceptación**:
- ✅ Objeto JSON se construye correctamente
- ✅ Validación completa antes de enviar
- ✅ Loading state durante envío
- ✅ Manejo de errores HTTP específicos (400, 404, 409, 500)
- ✅ Mensajes de error descriptivos
- ✅ Mensaje de éxito y cierre automático
- ✅ Formulario se resetea al cerrar
- ✅ Mapa se destruye correctamente

---

## 🎨 ESPECIFICACIONES DE DISEÑO

### Estructura HTML del Modal:
```html
<!-- Modal de Postulación -->
<div class="modal fade" id="modalPostulacion" tabindex="-1" aria-labelledby="modalPostulacionLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
        <div class="modal-content bg-dark text-white">
            <!-- Header -->
            <div class="modal-header border-secondary">
                <h5 class="modal-title" id="modalPostulacionLabel">
                    <i class="fas fa-file-signature me-2 text-primary"></i>
                    Postularse a Oferta Laboral
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            
            <!-- Body -->
            <div class="modal-body">
                <form id="form-postulacion" novalidate>
                    <div class="row">
                        <!-- Columna Izquierda: Formulario -->
                        <div class="col-md-6">
                            <h6 class="mb-3 text-info">
                                <i class="fas fa-user me-2"></i>Datos Personales
                            </h6>
                            
                            <!-- DNI -->
                            <div class="mb-3">
                                <label for="dni-postulacion" class="form-label">DNI *</label>
                                <input type="text" 
                                       class="form-control" 
                                       id="dni-postulacion" 
                                       name="dni" 
                                       pattern="[0-9]{7,8}" 
                                       required 
                                       placeholder="Sin puntos ni guiones"
                                       maxlength="8">
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <!-- Apellido -->
                            <div class="mb-3">
                                <label for="apellido-postulacion" class="form-label">Apellido *</label>
                                <input type="text" 
                                       class="form-control" 
                                       id="apellido-postulacion" 
                                       name="apellido" 
                                       required 
                                       minlength="2"
                                       placeholder="Ingrese su apellido">
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <!-- Nombre -->
                            <div class="mb-3">
                                <label for="nombre-postulacion" class="form-label">Nombre *</label>
                                <input type="text" 
                                       class="form-control" 
                                       id="nombre-postulacion" 
                                       name="nombre" 
                                       required 
                                       minlength="2"
                                       placeholder="Ingrese su nombre">
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <!-- Teléfono -->
                            <div class="mb-3">
                                <label for="telefono-postulacion" class="form-label">Teléfono *</label>
                                <input type="tel" 
                                       class="form-control" 
                                       id="telefono-postulacion" 
                                       name="telefono" 
                                       required 
                                       placeholder="Ej: +54 261 123-4567">
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <h6 class="mb-3 mt-4 text-info">
                                <i class="fas fa-map-marker-alt me-2"></i>Domicilio
                            </h6>
                            
                            <!-- Calle y Numeración -->
                            <div class="row">
                                <div class="col-md-8 mb-3">
                                    <label for="calle-postulacion" class="form-label">Calle *</label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="calle-postulacion" 
                                           name="calle" 
                                           required 
                                           minlength="3"
                                           placeholder="Nombre de la calle">
                                    <div class="invalid-feedback"></div>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label for="numeracion-postulacion" class="form-label">Número *</label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="numeracion-postulacion" 
                                           name="numeracion" 
                                           required 
                                           pattern="[0-9]+"
                                           placeholder="1234">
                                    <div class="invalid-feedback"></div>
                                </div>
                            </div>
                            
                            <!-- Código Postal -->
                            <div class="mb-3">
                                <label for="codigoPostal-postulacion" class="form-label">Código Postal *</label>
                                <input type="text" 
                                       class="form-control" 
                                       id="codigoPostal-postulacion" 
                                       name="codigoPostal" 
                                       required 
                                       pattern="[0-9]{4}"
                                       maxlength="4"
                                       placeholder="5500">
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <!-- Departamento -->
                            <div class="mb-3">
                                <label for="departamento-postulacion" class="form-label">Departamento *</label>
                                <select class="form-select" 
                                        id="departamento-postulacion" 
                                        name="departamento" 
                                        required>
                                    <option value="">Cargando...</option>
                                </select>
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <!-- Distrito -->
                            <div class="mb-3">
                                <label for="distrito-postulacion" class="form-label">Distrito *</label>
                                <select class="form-select" 
                                        id="distrito-postulacion" 
                                        name="distrito" 
                                        required 
                                        disabled>
                                    <option value="">Seleccione primero un departamento</option>
                                </select>
                                <div class="invalid-feedback"></div>
                            </div>
                            
                            <!-- Latitud y Longitud (readonly) -->
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="latitud-postulacion" class="form-label">Latitud *</label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="latitud-postulacion" 
                                           name="latitud" 
                                           required 
                                           readonly
                                           placeholder="Marque en el mapa">
                                    <div class="invalid-feedback"></div>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="longitud-postulacion" class="form-label">Longitud *</label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="longitud-postulacion" 
                                           name="longitud" 
                                           required 
                                           readonly
                                           placeholder="Marque en el mapa">
                                    <div class="invalid-feedback"></div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Columna Derecha: Mapa -->
                        <div class="col-md-6">
                            <h6 class="mb-3 text-info">
                                <i class="fas fa-map-marked-alt me-2"></i>Marque su Ubicación
                            </h6>
                            <p class="text-muted small mb-3">
                                Haga click en el mapa o arrastre el marcador para indicar su ubicación exacta.
                            </p>
                            
                            <div class="position-relative">
                                <div id="mapa-postulacion" style="height: 550px; border-radius: 8px; border: 1px solid #444;"></div>
                                <button type="button" 
                                        class="btn btn-sm btn-primary position-absolute top-0 end-0 m-2" 
                                        onclick="obtenerUbicacionActual()"
                                        style="z-index: 1000;">
                                    <i class="fas fa-crosshairs me-1"></i>
                                    Usar mi ubicación
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Footer -->
            <div class="modal-footer border-secondary">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                    <i class="fas fa-times me-2"></i>Cancelar
                </button>
                <button type="button" 
                        class="btn btn-primary" 
                        id="btn-enviar-postulacion"
                        onclick="enviarPostulacion()">
                    <i class="fas fa-paper-plane me-2"></i>Enviar Postulación
                </button>
            </div>
        </div>
    </div>
</div>
```

### Estilos CSS:
```css
/* Modal de Postulación */
#modalPostulacion .modal-content {
    background: #1a1a1a;
    color: #ffffff;
    border: 1px solid #333;
}

#modalPostulacion .modal-header,
#modalPostulacion .modal-footer {
    border-color: #444;
}

/* Formulario */
#form-postulacion .form-control,
#form-postulacion .form-select {
    background: #2a2a2a;
    border: 1px solid #444;
    color: #ffffff;
}

#form-postulacion .form-control:focus,
#form-postulacion .form-select:focus {
    background: #2a2a2a;
    border-color: #4A90E2;
    color: #ffffff;
    box-shadow: 0 0 0 0.2rem rgba(74, 144, 226, 0.25);
}

#form-postulacion .form-control::placeholder {
    color: #888;
}

#form-postulacion .form-control[readonly] {
    background: #1a1a1a;
    border-color: #555;
    cursor: not-allowed;
}

/* Validación */
#form-postulacion .form-control.is-invalid,
#form-postulacion .form-select.is-invalid {
    border-color: #dc3545;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right calc(0.375em + 0.1875rem) center;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

#form-postulacion .form-control.is-valid,
#form-postulacion .form-select.is-valid {
    border-color: #28a745;
    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%2328a745' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right calc(0.375em + 0.1875rem) center;
    background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
}

.invalid-feedback {
    display: none;
    color: #dc3545;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

/* Mapa */
#mapa-postulacion {
    background: #2a2a2a;
}

#mapa-postulacion .leaflet-control-attribution {
    background: rgba(42, 42, 42, 0.9);
    color: #ccc;
}

/* Responsive */
@media (max-width: 768px) {
    #mapa-postulacion {
        height: 300px !important;
        margin-top: 1rem;
    }
}
```

---

## 🔧 CONSIDERACIONES TÉCNICAS

### 1. Manejo de Estado del Mapa en Modales
**Problema**: Leaflet puede tener problemas de renderizado en modales de Bootstrap.  
**Solución**:
```javascript
modalElement.addEventListener('shown.bs.modal', function() {
    setTimeout(() => {
        if (mapaPostulacion) {
            mapaPostulacion.invalidateSize();
        }
    }, 300);
});
```

### 2. Prevención de Múltiples Marcadores
**Problema**: Usuario puede hacer click múltiples veces creando varios marcadores.  
**Solución**: Remover marcador previo antes de crear uno nuevo.

### 3. Validación de Coordenadas
**Problema**: Campos lat/lng pueden estar vacíos si usuario no marca ubicación.  
**Solución**: Validar que no estén vacíos antes de enviar.

### 4. Manejo de Errores de Red
**Problema**: Timeout o conexión perdida durante envío.  
**Solución**: Try-catch robusto con mensajes específicos.

### 5. Limpieza de Recursos
**Problema**: Mapa no se destruye al cerrar modal, causa memory leaks.  
**Solución**: Destruir instancia con `map.remove()` en evento `hidden.bs.modal`.

---

## 📊 ENDPOINT BACKEND ESPERADO

**Nota para el Backend Developer**: Se necesita implementar el siguiente endpoint:

### POST /publico/postulaciones

**Autenticación**: No requerida (endpoint público)

**Request Body**:
```json
{
    "idOferta": 123,
    "dni": "12345678",
    "apellido": "González",
    "nombre": "Juan Carlos",
    "domicilio": {
        "calle": "San Martín",
        "numeracion": "1234",
        "codigoPostal": "5500",
        "departamento": {
            "idDepartamento": 1
        },
        "distrito": {
            "idDistrito": 5
        },
        "latitud": -32.889458,
        "longitud": -68.845839
    },
    "telefono": "+54 261 123-4567"
}
```

**Response Success (201 Created)**:
```json
{
    "idPostulacion": 456,
    "mensaje": "Postulación enviada exitosamente",
    "fechaPostulacion": "2025-01-15T10:30:00Z"
}
```

**Response Error (400 Bad Request)**:
```json
{
    "error": "Validación fallida",
    "message": "El DNI ya existe para esta oferta",
    "timestamp": "2025-01-15T10:30:00Z"
}
```

**Response Error (409 Conflict)**:
```json
{
    "error": "Postulación duplicada",
    "message": "Ya existe una postulación suya para esta oferta",
    "timestamp": "2025-01-15T10:30:00Z"
}
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Estructura y UI
- [ ] Crear estructura HTML del modal
- [ ] Agregar estilos CSS personalizados
- [ ] Verificar responsive design (mobile/tablet/desktop)
- [ ] Configurar event listeners de apertura/cierre

### Fase 2: Carga de Datos
- [ ] Implementar `cargarDepartamentosPostulacion()`
- [ ] Implementar `cargarDistritosPostulacion(idDepartamento)`
- [ ] Configurar event listener onChange de departamento
- [ ] Implementar manejo de errores de APIs

### Fase 3: Mapa Interactivo
- [ ] Inicializar Leaflet en el modal
- [ ] Implementar colocación de marcador por click
- [ ] Implementar marcador draggable
- [ ] Sincronizar coordenadas con formulario
- [ ] Implementar botón "Usar mi ubicación"
- [ ] Fix de `invalidateSize()` para modales

### Fase 4: Validación
- [ ] Configurar validación HTML5 en todos los campos
- [ ] Implementar validación JavaScript personalizada
- [ ] Configurar validación en tiempo real (blur/input)
- [ ] Implementar feedback visual (is-valid/is-invalid)
- [ ] Mensajes de error descriptivos

### Fase 5: Envío y Respuesta
- [ ] Implementar construcción de objeto JSON
- [ ] Implementar función `enviarPostulacion()`
- [ ] Configurar loading states
- [ ] Manejo de respuestas exitosas (200/201)
- [ ] Manejo de errores HTTP (400/404/409/500)
- [ ] Mostrar mensajes de éxito/error

### Fase 6: Integración
- [ ] Modificar función `contactarEmpresa(ofertaId)`
- [ ] Crear función `abrirModalPostulacion(idOferta)`
- [ ] Implementar cierre y limpieza del modal
- [ ] Verificar que no hay conflictos con otros modales

### Fase 7: Testing
- [ ] Testing de carga de departamentos
- [ ] Testing de carga de distritos (dependencia)
- [ ] Testing de mapa (click, drag, popup)
- [ ] Testing de validación (todos los campos)
- [ ] Testing de envío (success/error paths)
- [ ] Testing responsive (mobile/tablet/desktop)
- [ ] Testing cross-browser (Chrome/Firefox/Safari)

---

## 🚀 ENTREGABLES

1. **Código JavaScript**: Todas las funciones implementadas en `js/app.js`
2. **HTML**: Estructura del modal agregada en `generarDashboard()` o HTML principal
3. **CSS**: Estilos personalizados agregados
4. **Documentación**: Comentarios en código explicando lógica compleja
5. **Testing**: Verificación de todos los casos de uso

---

## 📚 REFERENCIAS TÉCNICAS

- **Bootstrap 5 Modals**: https://getbootstrap.com/docs/5.0/components/modal/
- **Leaflet.js Docs**: https://leafletjs.com/reference.html
- **Geolocation API**: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- **HTML5 Form Validation**: https://developer.mozilla.org/en-US/docs/Learn/Forms/Form_validation
- **Fetch API**: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

---

## 🎓 NIVEL DE EXPERTISE REQUERIDO

**Junior/Mid-Level Developers**: Pueden implementar Fases 1-2 con supervisión.  
**Mid-Level Developers**: Pueden implementar Fases 1-5 de forma autónoma.  
**Senior Developers**: Pueden implementar el sistema completo con optimizaciones adicionales.

---

**Autor**: Ingeniero de Software Experto en Desarrollo Web  
**Stack**: JavaScript ES6+, Bootstrap 5, Leaflet.js, REST APIs  
**Fecha**: 2025  
**Versión**: 1.0
