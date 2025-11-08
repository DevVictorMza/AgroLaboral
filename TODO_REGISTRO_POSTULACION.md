# TODO: Implementación de Registro de Postulaciones

## 📋 LISTA DE TAREAS - REGISTRO DE POSTULACIONES

### ✅ ESTADO ACTUAL
- [x] Modal de postulación con formulario completo
- [x] Validación en tiempo real de campos
- [x] Mapa Leaflet para selección de ubicación
- [x] Carga de departamentos y distritos desde API
- [x] Construcción de objeto de datos del formulario
- [ ] **Integración con endpoint de registro**
- [ ] **Ajuste del formato del JSON al DTO del backend**
- [ ] **Manejo de respuestas HTTP específicas**
- [ ] **Testing del flujo completo**

---

## 🎯 FASE 1: ANÁLISIS DE DISCREPANCIAS (CRÍTICO)

### Tarea 1.1: Mapeo de Estructura de Datos
**Prioridad:** 🔴 ALTA  
**Estimación:** 15 min

**Problema Identificado:**
```javascript
// ACTUAL (app.js línea ~12450)
{
  "idOferta": 123,
  "dni": "12345678",
  "apellido": "González",
  "nombre": "Juan",
  "domicilio": {
    "calle": "San Martín",
    "numeracion": "1234",
    "codigoPostal": "5500",
    "departamento": {"idDepartamento": 1},
    "distrito": {"idDistrito": 5},
    "latitud": -32.889458,
    "longitud": -68.845839
  },
  "telefono": "+54 261 123-4567"
}
```

```json
// REQUERIDO POR BACKEND
{
  "persona": {
    "dni": "22222222",
    "apellido": "Uno",
    "nombre": "Uno",
    "calle": "Uno",
    "numeracion": "1111",
    "codigoPostal": "1111",
    "latitud": -33.08189,
    "longitud": -68.472291,
    "telefono": "1111111111",
    "idDistrito": 5  // PLANO, no objeto anidado
  },
  "idOfertaEmpleo": 4  // NOMBRE DIFERENTE
}
```

**Cambios Necesarios:**
1. ✅ Renombrar `idOferta` → `idOfertaEmpleo`
2. ✅ Crear objeto `persona` que contenga todos los datos personales
3. ✅ Aplanar estructura: `distrito.idDistrito` → `idDistrito` (número directo)
4. ✅ Mover `latitud` y `longitud` dentro de `persona` (fuera de `domicilio`)
5. ✅ Mover `telefono` dentro de `persona`
6. ✅ Eliminar objeto `domicilio` (campos pasan directamente a `persona`)
7. ✅ Eliminar objeto `departamento` anidado

**Acción:**
- Modificar función `construirDatosPostulacion()` en `app.js`

---

### Tarea 1.2: Verificación de Tipos de Datos
**Prioridad:** 🔴 ALTA  
**Estimación:** 10 min

**Checklist de Validación:**
- [ ] `idDistrito` debe ser `number`, no objeto `{idDistrito: 5}`
- [ ] `idOfertaEmpleo` debe ser `number`
- [ ] `latitud` y `longitud` deben ser `number` (parseFloat)
- [ ] `dni`, `apellido`, `nombre`, `calle`, `numeracion`, `codigoPostal`, `telefono` deben ser `string`

**Acción:**
- Actualizar función de construcción para asegurar tipos correctos

---

## 🔧 FASE 2: REFACTORIZACIÓN DE FUNCIÓN `construirDatosPostulacion()`

### Tarea 2.1: Reescribir Construcción de JSON
**Prioridad:** 🔴 ALTA  
**Estimación:** 20 min  
**Ubicación:** `js/app.js` línea ~12450

**Implementación:**
```javascript
function construirDatosPostulacion() {
    const form = document.getElementById('form-postulacion');
    const formData = new FormData(form);
    
    // Obtener ID de la oferta almacenado globalmente
    const idOfertaEmpleo = parseInt(form.dataset.ofertaId);
    
    // Obtener solo el ID del distrito (no el objeto completo)
    const selectDistrito = document.getElementById('distrito-postulacion');
    const idDistrito = parseInt(selectDistrito.value);
    
    // Construir objeto según estructura requerida por backend
    const datos = {
        persona: {
            dni: formData.get('dni').trim(),
            apellido: formData.get('apellido').trim(),
            nombre: formData.get('nombre').trim(),
            calle: formData.get('calle').trim(),
            numeracion: formData.get('numeracion').trim(),
            codigoPostal: formData.get('codigoPostal').trim(),
            latitud: parseFloat(formData.get('latitud')),
            longitud: parseFloat(formData.get('longitud')),
            telefono: formData.get('telefono').trim(),
            idDistrito: idDistrito
        },
        idOfertaEmpleo: idOfertaEmpleo
    };
    
    return datos;
}
```

**Validaciones Adicionales:**
- Verificar que `idDistrito` no sea `NaN` ni `0`
- Verificar que `idOfertaEmpleo` sea un número válido
- Verificar que coordenadas sean números válidos

---

### Tarea 2.2: Almacenar ID de Oferta en Modal
**Prioridad:** 🔴 ALTA  
**Estimación:** 10 min  
**Ubicación:** Función `abrirModalPostulacion(idOferta)`

**Problema:** Necesitamos pasar el `idOferta` a la función de envío.

**Solución:** Usar `data-attribute` en el formulario.

```javascript
function abrirModalPostulacion(idOferta) {
    const modalElement = document.getElementById('modalPostulacion');
    const form = document.getElementById('form-postulacion');
    
    // ✅ AÑADIR: Almacenar ID de oferta en el formulario
    form.dataset.ofertaId = idOferta;
    
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    // Inicializar modal después de mostrarlo
    modalElement.addEventListener('shown.bs.modal', function handler() {
        inicializarModalPostulacion(idOferta);
        modalElement.removeEventListener('shown.bs.modal', handler);
    });
}
```

---

## 🌐 FASE 3: IMPLEMENTACIÓN DEL ENDPOINT

### Tarea 3.1: Actualizar Función `enviarPostulacion()`
**Prioridad:** 🔴 ALTA  
**Estimación:** 25 min  
**Ubicación:** `js/app.js` línea ~12550

**Implementación Completa:**
```javascript
async function enviarPostulacion() {
    // 1. Validar formulario completo
    if (!validarFormularioCompleto()) {
        return;
    }
    
    // 2. Construir datos según formato backend
    const datos = construirDatosPostulacion();
    
    // 3. Validación adicional de datos críticos
    if (!datos.idOfertaEmpleo) {
        showMessage('Error: No se pudo identificar la oferta laboral', 'error');
        return;
    }
    
    if (!datos.persona.idDistrito || isNaN(datos.persona.idDistrito)) {
        showMessage('Error: Debe seleccionar un distrito válido', 'error');
        return;
    }
    
    // 4. Deshabilitar botón y mostrar loading
    const btnEnviar = document.getElementById('btn-enviar-postulacion');
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
    
    try {
        // 5. Enviar petición POST
        const response = await fetch('http://localhost:8080/publico/postulaciones/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });
        
        // 6. Manejo de respuestas según código HTTP
        if (response.status === 201) {
            // ✅ Registro exitoso
            showMessage('¡Postulación enviada exitosamente! La empresa se pondrá en contacto con usted.', 'success');
            cerrarModalPostulacion();
            
            // Opcional: Recargar ofertas para actualizar UI
            // cargarOfertasPublicas();
            
        } else if (response.status === 400) {
            // ⚠️ Datos inválidos
            const errorData = await response.json().catch(() => ({}));
            const mensaje = errorData.message || 'Los datos ingresados no son válidos. Por favor, revise el formulario.';
            showMessage(mensaje, 'error');
            
        } else if (response.status === 409) {
            // ⚠️ Conflicto - Postulación duplicada
            showMessage('Ya existe una postulación registrada con este DNI para esta oferta.', 'warning');
            
        } else if (response.status === 404) {
            // ⚠️ Oferta no encontrada
            showMessage('La oferta laboral ya no está disponible.', 'error');
            cerrarModalPostulacion();
            
        } else if (response.status >= 500) {
            // 🔴 Error del servidor
            showMessage('Error en el servidor. Por favor, intente nuevamente más tarde.', 'error');
            
        } else {
            // 🔴 Otro error
            showMessage('Ocurrió un error inesperado. Por favor, intente nuevamente.', 'error');
        }
        
    } catch (error) {
        // 7. Error de red o conexión
        console.error('Error al enviar postulación:', error);
        showMessage('Error de conexión. Verifique su conexión a internet e intente nuevamente.', 'error');
        
    } finally {
        // 8. Restaurar botón
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
    }
}
```

---

### Tarea 3.2: Logging y Debugging
**Prioridad:** 🟡 MEDIA  
**Estimación:** 10 min

**Añadir logs para debugging:**
```javascript
async function enviarPostulacion() {
    // ... código anterior ...
    
    const datos = construirDatosPostulacion();
    
    // 🔍 DEBUG: Imprimir datos antes de enviar
    console.log('📤 Enviando postulación:', JSON.stringify(datos, null, 2));
    
    try {
        const response = await fetch(/* ... */);
        
        // 🔍 DEBUG: Imprimir respuesta
        console.log('📥 Respuesta recibida:', response.status, response.statusText);
        
        // ... resto del código ...
    }
}
```

---

## 🧪 FASE 4: TESTING Y VALIDACIÓN

### Tarea 4.1: Test Manual - Caso Exitoso
**Prioridad:** 🔴 ALTA  
**Estimación:** 15 min

**Pasos:**
1. Abrir página de ofertas públicas
2. Click en "Postularse" en una oferta vigente
3. Llenar todos los campos del formulario:
   - DNI: 12345678
   - Apellido: González
   - Nombre: Juan
   - Teléfono: +54 261 123-4567
   - Calle: San Martín
   - Numeración: 1234
   - Código Postal: 5500
   - Departamento: Seleccionar uno
   - Distrito: Seleccionar uno
   - Ubicación: Marcar en mapa
4. Click en "Enviar"
5. **Verificar:**
   - ✅ Mensaje de éxito aparece
   - ✅ Modal se cierra
   - ✅ Backend devuelve HTTP 201
   - ✅ Registro aparece en base de datos

---

### Tarea 4.2: Test Manual - Validaciones
**Prioridad:** 🔴 ALTA  
**Estimación:** 20 min

**Casos a Probar:**

1. **Campo DNI inválido:**
   - Ingresar "123" → Error: "DNI debe tener 7-8 dígitos"
   - Ingresar "abcd1234" → Error: "DNI solo acepta números"

2. **Sin seleccionar distrito:**
   - No seleccionar departamento/distrito
   - Click "Enviar" → Error: "Debe seleccionar un distrito"

3. **Sin marcar ubicación:**
   - No hacer click en mapa
   - Click "Enviar" → Error: "Debe marcar su ubicación en el mapa"

4. **Postulación duplicada:**
   - Usar mismo DNI dos veces en misma oferta
   - Segunda vez → HTTP 409 → Mensaje: "Ya existe postulación..."

5. **Oferta inexistente:**
   - Modificar manualmente `idOfertaEmpleo` a 99999 (no existe)
   - Click "Enviar" → HTTP 404 → Mensaje: "Oferta no disponible"

---

### Tarea 4.3: Test de Consola - Verificar JSON
**Prioridad:** 🟡 MEDIA  
**Estimación:** 10 min

**Abrir DevTools y verificar:**
```javascript
// En consola del navegador, antes de enviar:
const form = document.getElementById('form-postulacion');
const datos = construirDatosPostulacion();
console.log(JSON.stringify(datos, null, 2));

// Verificar estructura:
// ✅ datos.persona existe
// ✅ datos.persona.idDistrito es number
// ✅ datos.idOfertaEmpleo es number
// ✅ datos.persona.latitud y longitud son number
// ❌ NO debe haber datos.domicilio
// ❌ NO debe haber datos.persona.departamento
```

---

### Tarea 4.4: Test de Red - Verificar Request
**Prioridad:** 🟡 MEDIA  
**Estimación:** 10 min

**En DevTools → Network:**
1. Filtrar por "postulaciones"
2. Enviar formulario
3. Click en request de registro
4. Verificar:
   - ✅ Method: POST
   - ✅ URL: `http://localhost:8080/publico/postulaciones/registro`
   - ✅ Request Headers: `Content-Type: application/json`
   - ✅ Request Payload coincide con estructura esperada
   - ✅ Response Status: 201 Created

---

## 🔒 FASE 5: SEGURIDAD Y ROBUSTEZ

### Tarea 5.1: Sanitización de Inputs
**Prioridad:** 🟡 MEDIA  
**Estimación:** 15 min

**Añadir función de sanitización:**
```javascript
function sanitizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    
    return texto
        .trim()
        .replace(/[<>]/g, '') // Prevenir XSS básico
        .substring(0, 255); // Limitar longitud
}

function construirDatosPostulacion() {
    // ... código anterior ...
    
    const datos = {
        persona: {
            dni: sanitizarTexto(formData.get('dni')),
            apellido: sanitizarTexto(formData.get('apellido')),
            nombre: sanitizarTexto(formData.get('nombre')),
            // ... resto de campos sanitizados
        },
        idOfertaEmpleo: idOfertaEmpleo
    };
    
    return datos;
}
```

---

### Tarea 5.2: Timeout de Request
**Prioridad:** 🟢 BAJA  
**Estimación:** 15 min

**Implementar timeout de 30 segundos:**
```javascript
async function enviarPostulacion() {
    // ... código anterior ...
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos
    
    try {
        const response = await fetch('http://localhost:8080/publico/postulaciones/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // ... resto del código ...
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            showMessage('La solicitud tardó demasiado. Por favor, intente nuevamente.', 'error');
        } else {
            showMessage('Error de conexión. Verifique su conexión a internet.', 'error');
        }
    }
}
```

---

### Tarea 5.3: Prevenir Doble Envío
**Prioridad:** 🟡 MEDIA  
**Estimación:** 10 min

**Variable de control:**
```javascript
let enviandoPostulacion = false;

async function enviarPostulacion() {
    // Prevenir doble click
    if (enviandoPostulacion) {
        console.warn('⚠️ Ya hay un envío en proceso');
        return;
    }
    
    enviandoPostulacion = true;
    
    try {
        // ... código de envío ...
    } finally {
        enviandoPostulacion = false;
    }
}
```

---

## 📊 RESUMEN DE TAREAS

### Críticas (Antes de Testing)
- [x] Tarea 1.1: Mapeo de estructura de datos
- [x] Tarea 1.2: Verificación de tipos
- [x] Tarea 2.1: Reescribir `construirDatosPostulacion()`
- [x] Tarea 2.2: Almacenar ID de oferta
- [x] Tarea 3.1: Actualizar `enviarPostulacion()`

### Testing Obligatorio
- [ ] Tarea 4.1: Test caso exitoso
- [ ] Tarea 4.2: Test validaciones
- [ ] Tarea 4.3: Verificar JSON
- [ ] Tarea 4.4: Verificar request HTTP

### Opcionales (Mejoras)
- [ ] Tarea 3.2: Logging y debugging
- [ ] Tarea 5.1: Sanitización de inputs
- [ ] Tarea 5.2: Timeout de request
- [ ] Tarea 5.3: Prevenir doble envío

---

## ⏱️ ESTIMACIÓN TOTAL
- **Críticas:** ~80 minutos
- **Testing:** ~55 minutos
- **Opcionales:** ~50 minutos
- **TOTAL:** ~3 horas

---

## 🎯 CRITERIOS DE ACEPTACIÓN

### ✅ Funcionalidad Core
1. Usuario puede postularse a una oferta laboral
2. Datos se envían correctamente al backend
3. JSON enviado coincide exactamente con el formato esperado
4. Backend devuelve HTTP 201 y registro se crea en BD

### ✅ Validaciones
1. Todos los campos obligatorios se validan
2. Tipos de datos son correctos (numbers, strings)
3. IDs de distrito y oferta son números válidos
4. Coordenadas son números flotantes válidos

### ✅ UX/UI
1. Mensajes de éxito/error son claros y descriptivos
2. Botón muestra estado de "Enviando..." durante request
3. Modal se cierra automáticamente tras éxito
4. No se permite doble envío accidental

### ✅ Manejo de Errores
1. Errores de validación muestran mensaje específico
2. Errores HTTP 400/404/409/500 se manejan apropiadamente
3. Errores de red se capturan y comunican al usuario
4. Timeout previene esperas infinitas

---

## 🚀 DEPLOYMENT CHECKLIST

Antes de considerar completa la implementación:

- [ ] Código implementado según especificaciones
- [ ] Tests manuales ejecutados y pasados
- [ ] Verificación en Network DevTools
- [ ] Backend confirma recepción correcta de datos
- [ ] Registro aparece en base de datos
- [ ] Sin errores en consola del navegador
- [ ] Sin warnings de JavaScript
- [ ] Mensajes de usuario son claros y en español
- [ ] Funcionalidad probada en diferentes ofertas
- [ ] Probado con datos edge cases (DNI largo, caracteres especiales, etc.)

