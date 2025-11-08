# TODO LIST: Modal de Postulación con Geolocalización

## 📋 FASE 1: ESTRUCTURA DEL MODAL (UI/UX)

### 1.1 Crear estructura HTML del modal
- **Descripción**: Crear modal Bootstrap 5 con diseño responsive y oscuro (consistente con el sistema)
- **Elementos**:
  - Modal con ID único: `modalPostulacion`
  - Header con título "Postularse a Oferta" + botón cerrar
  - Body dividido en 2 secciones: Formulario (izquierda) y Mapa (derecha)
  - Footer con botones "Cancelar" y "Enviar Postulación"
- **Validaciones UI**:
  - Modal debe ser `modal-xl` para espacio adecuado
  - Diseño responsive: en móvil el mapa va debajo del formulario
  - Estilos consistentes con tema oscuro del dashboard
- **Estado**: ❌ No iniciado

### 1.2 Diseñar formulario de datos personales
- **Descripción**: Crear formulario con todos los campos requeridos y validación HTML5
- **Campos del formulario**:
  1. DNI (input type="text", pattern numérico, required, 7-8 dígitos)
  2. Apellido (input type="text", required, min 2 caracteres)
  3. Nombre (input type="text", required, min 2 caracteres)
  4. Calle (input type="text", required)
  5. Numeración (input type="text", required, numérico)
  6. Código Postal (input type="text", required, pattern 4 dígitos)
  7. Departamento (select, required, carga dinámica desde API)
  8. Distrito (select, required, carga dinámica según departamento)
  9. Latitud (input type="text", readonly, autocompletado desde mapa)
  10. Longitud (input type="text", readonly, autocompletado desde mapa)
  11. Teléfono (input type="tel", required, pattern internacional)
- **Validaciones**:
  - Todos los campos con `required`
  - Validación de formato con `pattern` HTML5
  - Mensajes de error personalizados en español
  - Feedback visual (border rojo/verde según validación)
- **Estado**: ❌ No iniciado

### 1.3 Integrar mapa Leaflet en el modal
- **Descripción**: Implementar mapa interactivo con misma configuración que establecimientos
- **Configuración del mapa**:
  - Contenedor: `<div id="mapa-postulacion">` con altura mínima 400px
  - Tiles: OpenStreetMap (misma configuración existente)
  - Centro inicial: Mendoza, Argentina (lat: -32.8895, lng: -68.8458)
  - Zoom inicial: 13
  - Controles: zoom, fullscreen (opcional)
- **Interactividad**:
  - Click en mapa → agregar/mover marcador
  - Marcador actualiza campos latitud/longitud automáticamente
  - Marcador draggable (arrastrable)
  - Popup con coordenadas al hacer click
- **Estado**: ❌ No iniciado

---

## 📋 FASE 2: LÓGICA DE CARGA DE DATOS (API Integration)

### 2.1 Implementar carga de departamentos
- **Descripción**: Función para cargar departamentos desde API pública
- **Endpoint**: `GET http://localhost:8080/publico/departamentos`
- **Función**: `async cargarDepartamentosPostulacion()`
- **Proceso**:
  1. Fetch al endpoint (sin autenticación)
  2. Parsear respuesta JSON
  3. Poblar `<select id="departamento-postulacion">`
  4. Agregar opción default "Seleccione un departamento"
  5. Manejo de errores con retry
- **Validaciones**:
  - Verificar status 200 antes de parsear
  - Catch de errores de red
  - Mostrar mensaje si falla la carga
  - Deshabilitar select de distrito hasta elegir departamento
- **Estado**: ❌ No iniciado

### 2.2 Implementar carga de distritos (dependiente de departamento)
- **Descripción**: Función para cargar distritos según departamento seleccionado
- **Endpoint**: `GET http://localhost:8080/publico/distritos/{idDepartamento}`
- **Función**: `async cargarDistritosPostulacion(idDepartamento)`
- **Proceso**:
  1. Recibir idDepartamento del evento onChange del select
  2. Limpiar select de distritos
  3. Mostrar loading en select de distritos
  4. Fetch al endpoint con idDepartamento
  5. Poblar select con distritos recibidos
  6. Habilitar select de distritos
- **Validaciones**:
  - Validar que idDepartamento no sea null/undefined
  - Limpiar distritos previos al cambiar departamento
  - Mostrar "Sin distritos" si array vacío
  - Manejo de errores robusto
- **Estado**: ❌ No iniciado

### 2.3 Crear función de inicialización del modal
- **Descripción**: Función que se ejecuta al abrir el modal (evento shown.bs.modal)
- **Función**: `inicializarModalPostulacion(idOferta)`
- **Proceso**:
  1. Guardar idOferta en variable global o data attribute
  2. Resetear formulario (limpiar todos los campos)
  3. Cargar departamentos
  4. Inicializar mapa Leaflet
  5. Configurar event listeners del formulario
  6. Focus en primer campo (DNI)
- **Validaciones**:
  - Verificar que idOferta sea válido
  - Destruir instancia previa del mapa si existe
  - Remover event listeners duplicados
- **Estado**: ❌ No iniciado

---

## 📋 FASE 3: LÓGICA DEL MAPA INTERACTIVO

### 3.1 Inicializar mapa Leaflet en el modal
- **Descripción**: Configurar mapa con mismas características que mapa de establecimientos
- **Función**: `inicializarMapaPostulacion()`
- **Configuración**:
  ```javascript
  const mapaPostulacion = L.map('mapa-postulacion').setView([-32.8895, -68.8458], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
  }).addTo(mapaPostulacion);
  ```
- **Variables globales**:
  - `let mapaPostulacion = null;` (instancia del mapa)
  - `let marcadorPostulacion = null;` (marcador de ubicación)
- **Estado**: ❌ No iniciado

### 3.2 Implementar colocación de marcador por click
- **Descripción**: Permitir al usuario marcar su ubicación haciendo click en el mapa
- **Función**: Event listener en el mapa
- **Proceso**:
  1. Escuchar evento `click` del mapa
  2. Obtener coordenadas (e.latlng.lat, e.latlng.lng)
  3. Si existe marcador previo, removerlo
  4. Crear nuevo marcador en coordenadas clickeadas
  5. Actualizar campos latitud/longitud del formulario
  6. Centrar mapa en marcador
  7. Mostrar popup confirmando ubicación
- **Código ejemplo**:
  ```javascript
  mapaPostulacion.on('click', function(e) {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      if (marcadorPostulacion) {
          mapaPostulacion.removeLayer(marcadorPostulacion);
      }
      
      marcadorPostulacion = L.marker([lat, lng], { draggable: true })
          .addTo(mapaPostulacion)
          .bindPopup(`Ubicación: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
          .openPopup();
      
      document.getElementById('latitud-postulacion').value = lat.toFixed(6);
      document.getElementById('longitud-postulacion').value = lng.toFixed(6);
      
      // Event listener para drag del marcador
      marcadorPostulacion.on('dragend', actualizarCoordenadas);
  });
  ```
- **Estado**: ❌ No iniciado

### 3.3 Implementar marcador draggable (arrastrable)
- **Descripción**: Permitir que el usuario ajuste la ubicación arrastrando el marcador
- **Función**: `actualizarCoordenadas(event)`
- **Proceso**:
  1. Escuchar evento `dragend` del marcador
  2. Obtener nuevas coordenadas del marcador
  3. Actualizar campos latitud/longitud
  4. Actualizar popup del marcador
- **Código**:
  ```javascript
  function actualizarCoordenadas(e) {
      const pos = e.target.getLatLng();
      document.getElementById('latitud-postulacion').value = pos.lat.toFixed(6);
      document.getElementById('longitud-postulacion').value = pos.lng.toFixed(6);
      marcadorPostulacion.setPopupContent(`Ubicación: ${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`);
  }
  ```
- **Estado**: ❌ No iniciado

### 3.4 Implementar geolocalización del navegador (opcional pero recomendado)
- **Descripción**: Botón para obtener ubicación actual del usuario automáticamente
- **Función**: `obtenerUbicacionActual()`
- **Proceso**:
  1. Agregar botón "Usar mi ubicación" en el mapa
  2. Llamar a `navigator.geolocation.getCurrentPosition()`
  3. Si usuario acepta, obtener lat/lng
  4. Colocar marcador en ubicación actual
  5. Actualizar campos del formulario
  6. Centrar mapa en ubicación
- **Validaciones**:
  - Verificar soporte de geolocalización en navegador
  - Manejo de permisos denegados
  - Timeout de 10 segundos
  - Mostrar error si falla
- **Estado**: ❌ No iniciado

---

## 📋 FASE 4: VALIDACIÓN Y ENVÍO DEL FORMULARIO

### 4.1 Implementar validación completa del formulario
- **Descripción**: Validar todos los campos antes de enviar
- **Función**: `validarFormularioPostulacion()`
- **Validaciones específicas**:
  1. **DNI**: 7-8 dígitos numéricos, sin puntos ni guiones
  2. **Apellido/Nombre**: Mínimo 2 caracteres, solo letras y espacios
  3. **Calle**: No vacío, mínimo 3 caracteres
  4. **Numeración**: Numérico positivo
  5. **Código Postal**: 4 dígitos exactos (Mendoza)
  6. **Departamento**: Debe estar seleccionado (value !== "")
  7. **Distrito**: Debe estar seleccionado (value !== "")
  8. **Latitud/Longitud**: No vacíos, formato decimal válido
  9. **Teléfono**: Formato válido (con o sin código de área)
- **Feedback visual**:
  - Campos inválidos: border rojo + mensaje de error debajo
  - Campos válidos: border verde
  - Scroll automático al primer campo con error
- **Estado**: ❌ No iniciado

### 4.2 Crear objeto de datos para envío
- **Descripción**: Construir objeto JSON con estructura correcta para el backend
- **Función**: `construirDatosPostulacion()`
- **Estructura del objeto**:
  ```javascript
  {
      idOferta: Number,           // ID de la oferta (desde botón)
      dni: String,                // Sin puntos ni guiones
      apellido: String,
      nombre: String,
      domicilio: {
          calle: String,
          numeracion: String,
          codigoPostal: String,
          departamento: {
              idDepartamento: Number
          },
          distrito: {
              idDistrito: Number
          },
          latitud: Number,        // Convertir a Number
          longitud: Number        // Convertir a Number
      },
      telefono: String
  }
  ```
- **Validaciones**:
  - Convertir strings numéricos a Number donde corresponda
  - Trim de todos los campos de texto
  - Validar estructura antes de enviar
- **Estado**: ❌ No iniciado

### 4.3 Implementar función de envío al backend
- **Descripción**: Enviar datos de postulación al endpoint correspondiente
- **Endpoint**: `POST http://localhost:8080/publico/postulaciones` (VERIFICAR CON BACKEND)
- **Función**: `async enviarPostulacion(datosPostulacion)`
- **Proceso**:
  1. Validar formulario completo
  2. Mostrar loading en botón "Enviar"
  3. Construir objeto de datos
  4. Hacer POST al endpoint (sin autenticación - endpoint público)
  5. Esperar respuesta del backend
  6. Si éxito (200-201):
     - Mostrar mensaje de éxito
     - Cerrar modal
     - Resetear formulario
  7. Si error:
     - Mostrar mensaje de error específico
     - Mantener modal abierto
     - No resetear formulario
- **Manejo de errores**:
  - 400: Validación fallida (mostrar errores específicos)
  - 409: Postulación duplicada (DNI ya postulado a esta oferta)
  - 500: Error del servidor (mensaje genérico)
  - Network error: Problema de conexión
- **Estado**: ❌ No iniciado

### 4.4 Implementar feedback al usuario
- **Descripción**: Mostrar estados de carga, éxito y error
- **Elementos**:
  - **Loading**: Spinner en botón + deshabilitar formulario
  - **Éxito**: Toast verde con mensaje "Postulación enviada exitosamente"
  - **Error**: Toast rojo con mensaje específico del error
- **Función**: Reutilizar `showMessage()` existente
- **Estados del botón**:
  ```javascript
  // Loading
  <button disabled>
      <span class="spinner-border spinner-border-sm me-2"></span>
      Enviando...
  </button>
  
  // Normal
  <button>
      <i class="fas fa-paper-plane me-2"></i>
      Enviar Postulación
  </button>
  ```
- **Estado**: ❌ No iniciado

---

## 📋 FASE 5: INTEGRACIÓN CON SISTEMA EXISTENTE

### 5.1 Modificar función `contactarEmpresa()` existente
- **Descripción**: Reemplazar alert por apertura del modal
- **Ubicación actual**: `js/app.js` línea ~11678
- **Código actual**:
  ```javascript
  function contactarEmpresa(ofertaId) {
      alert(`Para contactar con esta empresa, debe registrarse como trabajador en la plataforma.\n\nOferta ID: ${ofertaId}`);
  }
  ```
- **Código nuevo**:
  ```javascript
  function contactarEmpresa(ofertaId) {
      abrirModalPostulacion(ofertaId);
  }
  ```
- **Estado**: ❌ No iniciado

### 5.2 Crear función `abrirModalPostulacion(idOferta)`
- **Descripción**: Función principal para abrir y configurar el modal
- **Proceso**:
  1. Guardar idOferta en variable global o dataset
  2. Obtener instancia del modal Bootstrap
  3. Resetear formulario
  4. Inicializar mapa
  5. Cargar departamentos
  6. Mostrar modal
  7. Focus en primer campo
- **Código**:
  ```javascript
  function abrirModalPostulacion(idOferta) {
      console.log('🎯 Abriendo modal de postulación para oferta:', idOferta);
      
      // Guardar ID de oferta
      window.ofertaActual = idOferta;
      
      // Resetear formulario
      document.getElementById('form-postulacion').reset();
      
      // Inicializar modal
      const modalElement = document.getElementById('modalPostulacion');
      const modal = new bootstrap.Modal(modalElement);
      
      // Configurar evento shown para inicializar mapa
      modalElement.addEventListener('shown.bs.modal', function() {
          inicializarModalPostulacion(idOferta);
      }, { once: true });
      
      modal.show();
  }
  ```
- **Estado**: ❌ No iniciado

### 5.3 Agregar estilos CSS específicos del modal
- **Descripción**: Estilos para modal, mapa y formulario
- **Archivo**: Agregar en `<style>` del dashboard o en CSS externo
- **Estilos necesarios**:
  ```css
  #mapa-postulacion {
      height: 450px;
      width: 100%;
      border-radius: 8px;
      border: 1px solid #444;
  }
  
  .modal-postulacion .modal-content {
      background: #1a1a1a;
      color: #ffffff;
  }
  
  .form-postulacion .form-control,
  .form-postulacion .form-select {
      background: #2a2a2a;
      border: 1px solid #444;
      color: #ffffff;
  }
  
  .form-postulacion .form-control:focus,
  .form-postulacion .form-select:focus {
      background: #2a2a2a;
      border-color: #4A90E2;
      color: #ffffff;
      box-shadow: 0 0 0 0.2rem rgba(74, 144, 226, 0.25);
  }
  
  .form-postulacion .form-control.is-invalid {
      border-color: #dc3545;
  }
  
  .form-postulacion .form-control.is-valid {
      border-color: #28a745;
  }
  
  .btn-obtener-ubicacion {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
      background: #4A90E2;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  ```
- **Estado**: ❌ No iniciado

---

## 📋 FASE 6: TESTING Y VALIDACIÓN

### 6.1 Testing de carga de datos
- **Descripción**: Verificar carga correcta de departamentos y distritos
- **Pruebas**:
  - ✅ Departamentos se cargan al abrir modal
  - ✅ Distritos se limpian al cambiar departamento
  - ✅ Distritos se cargan según departamento seleccionado
  - ✅ Manejo de errores de API (red caída, 500, etc.)
  - ✅ Loading states funcionan correctamente
- **Estado**: ❌ No iniciado

### 6.2 Testing del mapa interactivo
- **Descripción**: Verificar funcionalidad completa del mapa
- **Pruebas**:
  - ✅ Mapa se renderiza correctamente en modal
  - ✅ Click en mapa coloca marcador
  - ✅ Marcador es draggable
  - ✅ Coordenadas se actualizan al mover marcador
  - ✅ Campos latitud/longitud se actualizan automáticamente
  - ✅ Botón "Usar mi ubicación" funciona
  - ✅ Mapa se destruye al cerrar modal
- **Estado**: ❌ No iniciado

### 6.3 Testing de validación de formulario
- **Descripción**: Verificar todas las validaciones implementadas
- **Pruebas**:
  - ✅ Campos vacíos muestran error
  - ✅ DNI acepta solo números 7-8 dígitos
  - ✅ Código postal acepta solo 4 dígitos
  - ✅ Selects requieren selección válida
  - ✅ Latitud/longitud son requeridas
  - ✅ Feedback visual funciona (rojo/verde)
  - ✅ No se puede enviar formulario inválido
- **Estado**: ❌ No iniciado

### 6.4 Testing de envío de datos
- **Descripción**: Verificar envío correcto al backend
- **Pruebas**:
  - ✅ Objeto JSON se construye correctamente
  - ✅ POST request se envía con datos correctos
  - ✅ Respuesta 200/201 cierra modal y muestra éxito
  - ✅ Respuesta 400 muestra errores específicos
  - ✅ Respuesta 409 muestra postulación duplicada
  - ✅ Error de red muestra mensaje apropiado
  - ✅ Loading states durante envío
- **Estado**: ❌ No iniciado

### 6.5 Testing de integración
- **Descripción**: Verificar integración completa con sistema existente
- **Pruebas**:
  - ✅ Botón "Postularse" abre modal correcto
  - ✅ idOferta se pasa correctamente
  - ✅ Modal funciona en todas las vistas de ofertas
  - ✅ No hay conflictos con otros modales
  - ✅ Estilos consistentes con el sistema
  - ✅ Responsive design funciona correctamente
- **Estado**: ❌ No iniciado

---

## 📋 RESUMEN DE IMPLEMENTACIÓN

### Archivos a modificar/crear:

1. **js/app.js**:
   - Modificar función `contactarEmpresa()`
   - Agregar funciones de modal de postulación
   - Agregar funciones de mapa
   - Agregar funciones de validación y envío

2. **HTML (generado en `generarDashboard()` o archivo HTML)**:
   - Agregar estructura del modal
   - Agregar formulario completo
   - Agregar contenedor del mapa

3. **CSS (dashboard o archivo CSS)**:
   - Estilos del modal
   - Estilos del formulario
   - Estilos del mapa
   - Estilos de validación

### Endpoints a utilizar:

- `GET /publico/departamentos` - Cargar departamentos
- `GET /publico/distritos/{idDepartamento}` - Cargar distritos
- `POST /publico/postulaciones` - Enviar postulación (VERIFICAR CON BACKEND)

### Dependencias:

- Bootstrap 5 (ya incluido)
- Leaflet.js (ya incluido para mapas)
- Font Awesome (ya incluido)

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO:

1. **Primero**: FASE 1.1, 1.2 (Estructura del modal y formulario)
2. **Segundo**: FASE 2.1, 2.2 (Carga de departamentos y distritos)
3. **Tercero**: FASE 3.1, 3.2, 3.3 (Mapa interactivo)
4. **Cuarto**: FASE 4.1, 4.2, 4.3 (Validación y envío)
5. **Quinto**: FASE 5 (Integración completa)
6. **Sexto**: FASE 6 (Testing exhaustivo)

---

## ✅ CHECKLIST FINAL:

- [ ] Modal se abre correctamente al hacer click en "Postularse"
- [ ] Formulario tiene todos los campos requeridos
- [ ] Departamentos se cargan desde API
- [ ] Distritos se cargan dinámicamente según departamento
- [ ] Mapa Leaflet funciona correctamente
- [ ] Click en mapa coloca marcador
- [ ] Marcador es draggable
- [ ] Coordenadas se actualizan automáticamente
- [ ] Validación de formulario funciona
- [ ] Envío de datos al backend funciona
- [ ] Mensajes de éxito/error se muestran
- [ ] Modal se cierra al enviar exitosamente
- [ ] Formulario se resetea al cerrar modal
- [ ] Diseño responsive funciona
- [ ] Estilos consistentes con el sistema
- [ ] No requiere autenticación
- [ ] Testing completo realizado
