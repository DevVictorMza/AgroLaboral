# PROMPT PROFESIONAL: Integración de Endpoint de Registro de Postulaciones

## 🎯 CONTEXTO TÉCNICO

### Sistema
- **Frontend:** Vanilla JavaScript ES6+, Bootstrap 5, Leaflet.js
- **Backend:** Spring Boot REST API
- **Arquitectura:** SPA con Modal dinámico para postulaciones
- **Estado Actual:** Modal implementado con formulario completo y validaciones, falta integración con backend

### Endpoint Backend
```java
@PostMapping("/publico/postulaciones/registro")
public ResponseEntity<Void> registrar(@RequestBody PostulacionRegistroDTO dto) {
    servicioPostulacion.registrar(dto);
    return ResponseEntity.status(HttpStatus.CREATED).build();
}
```

**URL:** `http://localhost:8080/publico/postulaciones/registro`  
**Método:** POST  
**Autenticación:** No requerida (endpoint público)  
**Content-Type:** application/json

---

## 📋 ESPECIFICACIÓN DEL DTO

### Estructura del JSON Requerido
```json
{
  "persona": {
    "dni": "22222222",
    "apellido": "González",
    "nombre": "Juan",
    "calle": "San Martín",
    "numeracion": "1234",
    "codigoPostal": "5500",
    "latitud": -33.08189,
    "longitud": -68.472291,
    "telefono": "+54 261 123-4567",
    "idDistrito": 5
  },
  "idOfertaEmpleo": 4
}
```

### Mapeo de Tipos de Datos
| Campo | Tipo | Validación | Ejemplo |
|-------|------|------------|---------|
| `persona.dni` | String | 7-8 dígitos numéricos | "12345678" |
| `persona.apellido` | String | Min 2 caracteres | "González" |
| `persona.nombre` | String | Min 2 caracteres | "Juan" |
| `persona.calle` | String | Min 3 caracteres | "San Martín" |
| `persona.numeracion` | String | Numérico positivo | "1234" |
| `persona.codigoPostal` | String | 4 dígitos exactos | "5500" |
| `persona.latitud` | Number (float) | Rango válido para Mendoza | -33.08189 |
| `persona.longitud` | Number (float) | Rango válido para Mendoza | -68.472291 |
| `persona.telefono` | String | Formato internacional | "+54 261 123-4567" |
| `persona.idDistrito` | Number (int) | ID existente en BD | 5 |
| `idOfertaEmpleo` | Number (int) | ID de oferta vigente | 4 |

---

## 🔧 ARQUITECTURA ACTUAL DEL FRONTEND

### Funciones Existentes (js/app.js)

#### 1. `abrirModalPostulacion(idOferta)`
**Ubicación:** Línea ~11980  
**Responsabilidad:** Abrir modal de Bootstrap y configurar eventos  
**Problema Actual:** No almacena `idOferta` para uso posterior

#### 2. `inicializarModalPostulacion(idOferta)`
**Ubicación:** Línea ~12000  
**Responsabilidad:** Cargar departamentos, inicializar mapa, configurar validaciones  
**Estado:** ✅ Funcional

#### 3. `construirDatosPostulacion()`
**Ubicación:** Línea ~12450  
**Responsabilidad:** Construir objeto JSON desde FormData  
**Problema Crítico:** ❌ Estructura NO coincide con DTO backend

**Estructura Actual (INCORRECTA):**
```javascript
{
  "idOferta": 123,  // ❌ Debería ser "idOfertaEmpleo"
  "dni": "12345678",
  "apellido": "González",
  "nombre": "Juan",
  "domicilio": {  // ❌ No debe existir objeto "domicilio"
    "calle": "San Martín",
    "numeracion": "1234",
    "codigoPostal": "5500",
    "departamento": {"idDepartamento": 1},  // ❌ No debe estar en JSON
    "distrito": {"idDistrito": 5},  // ❌ Debe ser solo el número
    "latitud": -32.889458,  // ❌ Debe estar en "persona"
    "longitud": -68.845839  // ❌ Debe estar en "persona"
  },
  "telefono": "+54 261 123-4567"  // ❌ Debe estar en "persona"
}
```

#### 4. `enviarPostulacion()`
**Ubicación:** Línea ~12550  
**Responsabilidad:** Validar y enviar datos al backend  
**Problema:** ❌ Endpoint hardcodeado como `/publico/postulaciones` (incorrecto)

---

## 🎯 OBJETIVO DE LA TAREA

### Requisitos Funcionales

1. **RF-1: Adaptación de Estructura de Datos**
   - Refactorizar `construirDatosPostulacion()` para generar JSON exacto según DTO
   - Aplanar estructura eliminando objeto `domicilio`
   - Mover `latitud`, `longitud`, `telefono` a objeto `persona`
   - Convertir `distrito.idDistrito` a número plano `idDistrito`
   - Renombrar `idOferta` → `idOfertaEmpleo`

2. **RF-2: Integración con Endpoint Correcto**
   - Actualizar URL a `http://localhost:8080/publico/postulaciones/registro`
   - Configurar headers: `Content-Type: application/json`
   - Método: POST

3. **RF-3: Manejo de Respuestas HTTP**
   - **201 Created:** Éxito → Mensaje de confirmación → Cerrar modal
   - **400 Bad Request:** Datos inválidos → Mensaje específico
   - **404 Not Found:** Oferta no existe → Mensaje + cerrar modal
   - **409 Conflict:** Postulación duplicada (DNI ya registrado en oferta)
   - **500+ Server Error:** Error servidor → Mensaje genérico

4. **RF-4: UX durante Request**
   - Deshabilitar botón "Enviar" durante petición
   - Mostrar indicador de loading: "Enviando..."
   - Restaurar botón tras respuesta

5. **RF-5: Persistencia de ID de Oferta**
   - Almacenar `idOferta` en `abrirModalPostulacion()`
   - Usar `data-attribute` del formulario: `form.dataset.ofertaId`
   - Recuperar en `construirDatosPostulacion()`

### Requisitos No Funcionales

1. **RNF-1: Validación Pre-Envío**
   - Ejecutar `validarFormularioCompleto()` antes de fetch
   - Verificar `idDistrito` no sea `NaN` ni `0`
   - Verificar coordenadas sean números válidos

2. **RNF-2: Manejo de Errores Robusto**
   - Try-catch para errores de red
   - Timeout de 30 segundos
   - Prevenir doble envío con flag `enviandoPostulacion`

3. **RNF-3: Logging y Debugging**
   - Console.log del JSON construido antes de enviar
   - Console.log de respuesta HTTP
   - Console.error de excepciones

4. **RNF-4: Sanitización de Inputs**
   - Trim de strings
   - ParseFloat explícito de coordenadas
   - ParseInt explícito de IDs

---

## 💻 IMPLEMENTACIÓN REQUERIDA

### Paso 1: Modificar `abrirModalPostulacion()`

**Archivo:** `js/app.js`  
**Línea:** ~11980

```javascript
function abrirModalPostulacion(idOferta) {
    const modalElement = document.getElementById('modalPostulacion');
    const form = document.getElementById('form-postulacion');
    
    // ✅ AÑADIR: Almacenar ID de oferta en data-attribute
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

**Justificación:** Permite acceder al `idOferta` desde cualquier función sin variables globales adicionales.

---

### Paso 2: Reescribir `construirDatosPostulacion()`

**Archivo:** `js/app.js`  
**Línea:** ~12450

```javascript
function construirDatosPostulacion() {
    const form = document.getElementById('form-postulacion');
    const formData = new FormData(form);
    
    // Recuperar ID de la oferta del data-attribute
    const idOfertaEmpleo = parseInt(form.dataset.ofertaId);
    
    // Obtener solo el ID del distrito (no el objeto completo)
    const selectDistrito = document.getElementById('distrito-postulacion');
    const idDistrito = parseInt(selectDistrito.value);
    
    // Validaciones adicionales
    if (isNaN(idOfertaEmpleo) || idOfertaEmpleo <= 0) {
        throw new Error('ID de oferta inválido');
    }
    
    if (isNaN(idDistrito) || idDistrito <= 0) {
        throw new Error('ID de distrito inválido');
    }
    
    // Construir objeto según estructura exacta del DTO backend
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
    
    // Validar que coordenadas sean números válidos
    if (isNaN(datos.persona.latitud) || isNaN(datos.persona.longitud)) {
        throw new Error('Coordenadas inválidas. Por favor, marque su ubicación en el mapa.');
    }
    
    return datos;
}
```

**Cambios Clave:**
- ✅ Objeto `persona` contiene todos los datos personales
- ✅ `idDistrito` es número plano, no objeto
- ✅ `latitud` y `longitud` dentro de `persona`
- ✅ `telefono` dentro de `persona`
- ✅ `idOfertaEmpleo` en nivel raíz
- ✅ Sin objeto `domicilio`
- ✅ Sin objeto `departamento`

---

### Paso 3: Actualizar `enviarPostulacion()`

**Archivo:** `js/app.js`  
**Línea:** ~12550

```javascript
let enviandoPostulacion = false;

async function enviarPostulacion() {
    // Prevenir doble envío
    if (enviandoPostulacion) {
        console.warn('⚠️ Ya hay un envío en proceso');
        return;
    }
    
    // Validar formulario completo
    if (!validarFormularioCompleto()) {
        return;
    }
    
    let datos;
    try {
        // Construir datos (puede lanzar excepciones)
        datos = construirDatosPostulacion();
    } catch (error) {
        showMessage(error.message, 'error');
        return;
    }
    
    // Debug: Mostrar JSON que se enviará
    console.log('📤 Enviando postulación:', JSON.stringify(datos, null, 2));
    
    // Preparar UI
    const btnEnviar = document.getElementById('btn-enviar-postulacion');
    const textoOriginal = btnEnviar.innerHTML;
    btnEnviar.disabled = true;
    btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
    enviandoPostulacion = true;
    
    // Configurar timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
        // Realizar petición POST
        const response = await fetch('http://localhost:8080/publico/postulaciones/registro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Debug: Mostrar respuesta
        console.log('📥 Respuesta recibida:', response.status, response.statusText);
        
        // Manejo de respuestas según código HTTP
        if (response.status === 201) {
            // ✅ ÉXITO: Registro creado
            showMessage(
                '¡Postulación enviada exitosamente! La empresa se pondrá en contacto con usted pronto.',
                'success'
            );
            cerrarModalPostulacion();
            
        } else if (response.status === 400) {
            // ⚠️ ERROR DE VALIDACIÓN
            let mensaje = 'Los datos ingresados no son válidos. Por favor, revise el formulario.';
            
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    mensaje = errorData.message;
                }
            } catch (e) {
                // Si no hay JSON en respuesta, usar mensaje genérico
            }
            
            showMessage(mensaje, 'error');
            
        } else if (response.status === 404) {
            // ⚠️ OFERTA NO ENCONTRADA
            showMessage(
                'La oferta laboral ya no está disponible o ha sido eliminada.',
                'error'
            );
            cerrarModalPostulacion();
            
        } else if (response.status === 409) {
            // ⚠️ CONFLICTO - POSTULACIÓN DUPLICADA
            showMessage(
                'Ya existe una postulación registrada con este DNI para esta oferta laboral.',
                'warning'
            );
            
        } else if (response.status >= 500) {
            // 🔴 ERROR DEL SERVIDOR
            showMessage(
                'Error en el servidor. Por favor, intente nuevamente más tarde.',
                'error'
            );
            
        } else {
            // 🔴 OTRO ERROR HTTP
            showMessage(
                `Error inesperado (${response.status}). Por favor, intente nuevamente.`,
                'error'
            );
        }
        
    } catch (error) {
        clearTimeout(timeoutId);
        
        // Manejo de errores de red/timeout
        if (error.name === 'AbortError') {
            showMessage(
                'La solicitud tardó demasiado tiempo. Por favor, verifique su conexión e intente nuevamente.',
                'error'
            );
        } else {
            console.error('❌ Error al enviar postulación:', error);
            showMessage(
                'Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.',
                'error'
            );
        }
        
    } finally {
        // Restaurar UI y flag
        btnEnviar.disabled = false;
        btnEnviar.innerHTML = textoOriginal;
        enviandoPostulacion = false;
    }
}
```

**Características Implementadas:**
- ✅ Validación pre-envío
- ✅ Construcción segura de datos con try-catch
- ✅ Endpoint correcto
- ✅ Headers correctos
- ✅ Timeout de 30 segundos
- ✅ Manejo detallado de códigos HTTP
- ✅ Prevención de doble envío
- ✅ UI feedback (loading, disabled)
- ✅ Logging para debugging
- ✅ Mensajes descriptivos en español

---

## 🧪 CRITERIOS DE VALIDACIÓN

### Tests Manuales Requeridos

#### Test 1: Flujo Exitoso
```
GIVEN: Oferta laboral vigente con ID 4
AND: Formulario completado correctamente
WHEN: Usuario hace click en "Enviar"
THEN: 
  - Request POST a /publico/postulaciones/registro
  - Body JSON coincide exactamente con estructura DTO
  - Response HTTP 201 Created
  - Mensaje de éxito aparece
  - Modal se cierra automáticamente
  - Registro aparece en base de datos
```

#### Test 2: Validación de Campos
```
GIVEN: Modal de postulación abierto
WHEN: Usuario intenta enviar sin llenar todos los campos
THEN:
  - Función validarFormularioCompleto() retorna false
  - Request NO se envía
  - Mensajes de error aparecen en campos inválidos
  - Scroll a primer error
```

#### Test 3: Postulación Duplicada
```
GIVEN: Postulación ya existe con DNI 12345678 en oferta 4
WHEN: Usuario intenta postularse nuevamente con mismo DNI
THEN:
  - Request se envía
  - Response HTTP 409 Conflict
  - Mensaje: "Ya existe una postulación registrada con este DNI..."
  - Modal permanece abierto
```

#### Test 4: Oferta Inexistente
```
GIVEN: ID de oferta 99999 (no existe)
WHEN: Usuario envía postulación
THEN:
  - Response HTTP 404 Not Found
  - Mensaje: "La oferta laboral ya no está disponible..."
  - Modal se cierra
```

#### Test 5: Error de Conexión
```
GIVEN: Backend detenido o sin conexión
WHEN: Usuario envía postulación
THEN:
  - Catch de error de red
  - Mensaje: "Error de conexión. Verifique su conexión..."
  - Botón se restaura
```

---

## 📊 VERIFICACIÓN EN DEVTOOLS

### Network Tab
**Request esperado:**
```http
POST http://localhost:8080/publico/postulaciones/registro HTTP/1.1
Content-Type: application/json

{
  "persona": {
    "dni": "12345678",
    "apellido": "González",
    "nombre": "Juan",
    "calle": "San Martín",
    "numeracion": "1234",
    "codigoPostal": "5500",
    "latitud": -33.08189,
    "longitud": -68.472291,
    "telefono": "+54 261 123-4567",
    "idDistrito": 5
  },
  "idOfertaEmpleo": 4
}
```

**Response esperado:**
```http
HTTP/1.1 201 Created
Content-Length: 0
```

### Console Tab
**Logs esperados:**
```
📤 Enviando postulación: {
  "persona": { ... },
  "idOfertaEmpleo": 4
}
📥 Respuesta recibida: 201 Created
```

---

## 🚨 CASOS EDGE A CONSIDERAR

1. **Coordenadas no marcadas:** Validar que latitud/longitud no sean vacías
2. **Distrito no seleccionado:** `idDistrito === 0` debe dar error
3. **ID de oferta inválido:** Verificar `isNaN()` y valor positivo
4. **Caracteres especiales en nombres:** Sanitizar sin eliminar tildes
5. **DNI con puntos:** Limpiar antes de enviar
6. **Teléfono en diferentes formatos:** Aceptar múltiples formatos
7. **Timeout de red:** Abortar después de 30 segundos
8. **Doble click rápido:** Prevenir con flag `enviandoPostulacion`

---

## 📝 CHECKLIST DE COMPLETITUD

Antes de marcar como "DONE", verificar:

- [ ] `construirDatosPostulacion()` genera JSON exacto del DTO
- [ ] `idOferta` se almacena en `form.dataset.ofertaId`
- [ ] Endpoint URL es `/publico/postulaciones/registro`
- [ ] Método HTTP es POST
- [ ] Header `Content-Type: application/json` configurado
- [ ] Validación pre-envío ejecuta `validarFormularioCompleto()`
- [ ] HTTP 201 muestra mensaje de éxito y cierra modal
- [ ] HTTP 400 muestra error de validación
- [ ] HTTP 404 muestra oferta no disponible
- [ ] HTTP 409 muestra postulación duplicada
- [ ] HTTP 500+ muestra error de servidor
- [ ] Errores de red capturados con try-catch
- [ ] Timeout de 30 segundos implementado
- [ ] Botón muestra "Enviando..." durante request
- [ ] Doble envío prevenido con flag
- [ ] Console.log muestra JSON antes de enviar
- [ ] Tests manuales ejecutados y pasados
- [ ] Registro confirmado en base de datos
- [ ] Sin errores en consola del navegador

---

## 🎓 ESTÁNDARES DE CÓDIGO

### Convenciones
- **Nombres de variables:** camelCase
- **Mensajes de error:** En español, descriptivos
- **Logging:** Emojis para facilitar lectura en consola
- **Comentarios:** Explicar "por qué", no "qué"
- **Manejo de errores:** Try-catch con mensajes específicos

### Estructura de Commits
```
feat: integración de endpoint de registro de postulaciones

- Refactorizada construirDatosPostulacion() para coincidir con DTO backend
- Actualizado enviarPostulacion() con endpoint correcto
- Implementado manejo de respuestas HTTP 201/400/404/409/500
- Agregado timeout de 30 segundos
- Agregada prevención de doble envío
- Agregado logging para debugging

BREAKING CHANGE: Estructura de JSON de postulación modificada
```

---

## 🔗 REFERENCIAS

- **Documentación del DTO Backend:** Ver archivo `PostulacionRegistroDTO.java`
- **Validaciones del formulario:** Función `validarFormularioCompleto()` en app.js
- **Función de mensajes:** `showMessage(mensaje, tipo)` en app.js
- **Modal de Bootstrap:** https://getbootstrap.com/docs/5.3/components/modal/
- **Fetch API:** https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
- **AbortController:** https://developer.mozilla.org/en-US/docs/Web/API/AbortController

---

## ✅ ENTREGABLES ESPERADOS

1. **Código modificado:** 3 funciones actualizadas en `js/app.js`
2. **Tests pasados:** 5 tests manuales ejecutados y documentados
3. **Screenshots:** Network tab mostrando request/response exitoso
4. **Database:** Registro de postulación visible en BD
5. **Console:** Sin errores JavaScript

**Tiempo estimado:** 2-3 horas  
**Prioridad:** 🔴 CRÍTICA  
**Complejidad:** ⭐⭐⭐ (Media-Alta)

