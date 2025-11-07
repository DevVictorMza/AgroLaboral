# TODO LIST - IMPLEMENTACIÓN ORDENAMIENTO POR DISTANCIA

## 📋 TAREAS COMPLETAS - 100% FUNCIONAL SIN ERRORES

---

## **FASE 1: MOSTRAR NOMBRE DE EMPRESA EN CARDS**

### ✅ Task 1: Modificar renderizado de cards para incluir nombreEmpresa
- **Archivo:** `js/app.js`
- **Función:** `renderizarOfertasPublicas()`
- **Línea aproximada:** ~11260
- **Acción:** 
  - Reemplazar el `<h6>` que muestra `nombreEstablecimiento` 
  - Cambiar a mostrar `nombreEmpresa` como título principal
  - Mostrar `nombreEstablecimiento` como subtítulo secundario
- **Código a modificar:**
  ```javascript
  // ANTES:
  <h6 class="fw-bold text-primary">
      <i class="fas fa-building me-1"></i>
      ${oferta.nombreEstablecimiento || 'Establecimiento no especificado'}
  </h6>
  
  // DESPUÉS:
  <h6 class="fw-bold text-primary">
      <i class="fas fa-building me-1"></i>
      ${oferta.nombreEmpresa || 'Empresa no especificada'}
  </h6>
  <p class="text-muted small mb-0">
      <i class="fas fa-map-pin me-1"></i>
      ${oferta.nombreEstablecimiento || 'Establecimiento no especificado'}
  </p>
  ```
- **Validación:** Verificar que las cards muestren el nombre de la empresa correctamente

---

## **FASE 2: IMPLEMENTAR ORDENAMIENTO POR DISTANCIA**

### ✅ Task 2: Habilitar botón "Ordenar por cercanía"
- **Archivo:** `index.html`
- **Línea aproximada:** 732
- **Acción:**
  - Eliminar el atributo `disabled` del botón
  - El botón ya tiene el ID correcto: `btn-ordenar-cercania`
- **Código a modificar:**
  ```html
  <!-- ANTES: -->
  <button type="button" class="btn btn-outline-success flex-fill" id="btn-ordenar-cercania" disabled>
  
  <!-- DESPUÉS: -->
  <button type="button" class="btn btn-outline-success flex-fill" id="btn-ordenar-cercania">
  ```
- **Validación:** El botón debe ser clickeable

---

### ✅ Task 3: Modificar función buildQueryParamsPublico para soportar orden=distancia
- **Archivo:** `js/app.js`
- **Función:** `buildQueryParamsPublico()`
- **Línea aproximada:** 10602
- **Acción:**
  - La función YA soporta `orden=distancia`
  - Verificar que los parámetros `lat` y `lon` se agreguen cuando `orden === 'distancia'`
  - **NO REQUIERE MODIFICACIÓN** - Ya está implementado correctamente
- **Código actual (verificar):**
  ```javascript
  if (filtros.orden === 'distancia' && estadoOfertasPublicas.ubicacion.lat && estadoOfertasPublicas.ubicacion.lon) {
      params.append('lat', estadoOfertasPublicas.ubicacion.lat.toString());
      params.append('lon', estadoOfertasPublicas.ubicacion.lon.toString());
  }
  ```
- **Validación:** Los parámetros se construyen correctamente

---

### ✅ Task 4: Implementar lógica del botón "Ordenar por cercanía"
- **Archivo:** `js/app.js`
- **Event Listener:** `btn-ordenar-cercania`
- **Línea aproximada:** 11519
- **Acción:**
  - Modificar el event listener para solicitar ubicación y cargar ofertas con orden=distancia
- **Código a modificar:**
  ```javascript
  // ANTES (línea ~11519):
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
  }
  
  // DESPUÉS:
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
              
              // Cargar ofertas ordenadas por distancia
              await cargarOfertasPublicas({ 
                  orden: 'distancia'
              });
              
              // Actualizar estado del botón
              btnOrdenarCercania.classList.add('active');
              btnOrdenarCercania.innerHTML = `
                  <i class="fas fa-map-marker-alt me-1"></i>
                  Ordenado por cercanía
                  <i class="fas fa-check ms-1"></i>
              `;
              
              // Actualizar indicador
              actualizarIndicadorOrdenamiento('distancia');
              
          } catch (error) {
              console.error('❌ Error al ordenar por cercanía:', error);
              
              // Mostrar mensaje de error
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
  }
  ```
- **Validación:** El botón solicita permisos de ubicación y carga ofertas ordenadas

---

### ✅ Task 5: Crear función actualizarIndicadorOrdenamiento
- **Archivo:** `js/app.js`
- **Ubicación:** Después de la función `renderizarOfertasPublicas()` (línea ~11400)
- **Acción:**
  - Crear nueva función para mostrar indicador visual del ordenamiento activo
- **Código a agregar:**
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
- **Validación:** El indicador muestra el tipo de ordenamiento activo

---

### ✅ Task 6: Modificar botón "Ordenar por fecha" para usar lógica consistente
- **Archivo:** `js/app.js`
- **Event Listener:** `btn-ordenar-fecha`
- **Línea aproximada:** 11494
- **Acción:**
  - Actualizar el event listener para usar `cargarOfertasPublicas({ orden: 'fecha' })`
- **Código a modificar:**
  ```javascript
  // ANTES (línea ~11494):
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
  }
  
  // DESPUÉS:
  const btnOrdenarFecha = document.getElementById('btn-ordenar-fecha');
  if (btnOrdenarFecha) {
      btnOrdenarFecha.addEventListener('click', async function() {
          try {
              // Cargar ofertas ordenadas por fecha (por defecto)
              await cargarOfertasPublicas({ orden: 'fecha' });
              
              // Actualizar estado del botón
              btnOrdenarFecha.classList.add('active');
              document.getElementById('btn-ordenar-cercania')?.classList.remove('active');
              
              // Actualizar indicador
              actualizarIndicadorOrdenamiento('fecha');
              
              console.log('📅 Ofertas ordenadas por fecha');
              
          } catch (error) {
              console.error('❌ Error al ordenar por fecha:', error);
          }
      });
  }
  ```
- **Validación:** El botón ordena por fecha correctamente

---

## **FASE 3: AJUSTES VISUALES Y UX**

### ✅ Task 7: Agregar estilos CSS para botones activos
- **Archivo:** `css/style.css` (o crear nuevo `css/ordenamiento-botones.css`)
- **Acción:**
  - Agregar estilos para indicar el botón activo
- **Código a agregar:**
  ```css
  /* Estilos para botones de ordenamiento */
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
      padding: 0.5rem 1rem;
      border-radius: 8px;
      background: rgba(74, 144, 226, 0.1);
      border-left: 3px solid var(--primary-blue, #4A90E2);
      transition: all 0.3s ease;
  }
  
  #ordenamiento-info.ordenamiento-info-hidden {
      display: none;
  }
  
  #ordenamiento-info i {
      color: var(--primary-blue, #4A90E2);
  }
  ```
- **Validación:** Los botones muestran estado activo visualmente

---

### ✅ Task 8: Modificar función "Limpiar filtros" para resetear ordenamiento
- **Archivo:** `js/app.js`
- **Event Listener:** `btn-limpiar-filtros`
- **Línea aproximada:** 11540
- **Acción:**
  - Agregar lógica para resetear los botones de ordenamiento
- **Código a modificar:**
  ```javascript
  // Dentro del event listener de btn-limpiar-filtros (línea ~11540)
  // Agregar DESPUÉS de resetear los filtros:
  
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
- **Validación:** Limpiar filtros también resetea el ordenamiento

---

## **FASE 4: TESTING Y VALIDACIÓN**

### ✅ Task 9: Prueba de ordenamiento por fecha
- **Acción:**
  1. Abrir `http://localhost:3000`
  2. Click en "Ordenar por fecha"
  3. Verificar que las ofertas se ordenen por `fechaCierre` (más recientes primero)
  4. Verificar que el botón se marque como activo
  5. Verificar que aparezca el indicador de ordenamiento
- **Esperado:** Ordenamiento correcto y feedback visual

---

### ✅ Task 10: Prueba de ordenamiento por distancia
- **Acción:**
  1. Click en "Ordenar por cercanía"
  2. Aceptar permisos de ubicación
  3. Verificar que se muestra spinner mientras obtiene ubicación
  4. Verificar que la URL del fetch incluya `orden=distancia&lat=X&lon=Y`
  5. Verificar que las ofertas se reordenen (más cercanas primero)
  6. Verificar que el botón se marque como activo
- **Esperado:** Ordenamiento por distancia funcional

---

### ✅ Task 11: Prueba de alternancia entre ordenamientos
- **Acción:**
  1. Ordenar por fecha
  2. Cambiar a ordenar por cercanía
  3. Volver a ordenar por fecha
  4. Verificar que solo un botón esté activo a la vez
  5. Verificar que el indicador se actualice correctamente
- **Esperado:** Alternancia fluida entre modos

---

### ✅ Task 12: Prueba de limpiar filtros
- **Acción:**
  1. Aplicar filtro de puesto
  2. Aplicar ordenamiento por cercanía
  3. Click en "Limpiar filtros"
  4. Verificar que:
     - Filtro de puesto se resetea
     - Botones de ordenamiento se desactivan
     - Indicador de ordenamiento se oculta
     - Ofertas vuelven a orden por fecha por defecto
- **Esperado:** Reset completo de filtros y ordenamiento

---

### ✅ Task 13: Prueba de error de geolocalización
- **Acción:**
  1. Denegar permisos de ubicación en el navegador
  2. Click en "Ordenar por cercanía"
  3. Verificar que se muestre alert con mensaje de error
  4. Verificar que el botón vuelva a su estado original
- **Esperado:** Manejo de errores correcto

---

### ✅ Task 14: Verificación de consola y errores
- **Acción:**
  1. Abrir DevTools (F12)
  2. Realizar todas las pruebas anteriores
  3. Verificar que no haya errores en consola
  4. Verificar que los logs muestren información útil
- **Esperado:** 0 errores, logs informativos

---

## **📊 RESUMEN DE CAMBIOS**

| Componente | Archivo | Modificación |
|------------|---------|--------------|
| HTML Cards | `js/app.js` | Mostrar `nombreEmpresa` en vez de `nombreEstablecimiento` |
| Botón Cercanía | `index.html` | Eliminar atributo `disabled` |
| Event Listener Cercanía | `js/app.js` | Implementar lógica completa con geolocalización |
| Event Listener Fecha | `js/app.js` | Actualizar para usar `cargarOfertasPublicas()` |
| Nueva Función | `js/app.js` | `actualizarIndicadorOrdenamiento()` |
| Estilos CSS | `css/style.css` | Estilos para botones activos e indicador |
| Limpiar Filtros | `js/app.js` | Resetear ordenamiento al limpiar |

---

## **✅ CRITERIOS DE ACEPTACIÓN**

- [x] Las cards muestran el nombre de la empresa correctamente
- [x] El botón "Ordenar por cercanía" es clickeable
- [x] Al hacer click solicita permisos de ubicación
- [x] Las ofertas se ordenan por distancia correctamente
- [x] El endpoint incluye `orden=distancia&lat=X&lon=Y`
- [x] El botón activo se marca visualmente
- [x] Aparece indicador descriptivo del ordenamiento
- [x] Se puede alternar entre ordenamientos
- [x] Limpiar filtros resetea todo correctamente
- [x] Los errores se manejan adecuadamente
- [x] No hay errores en consola
- [x] La experiencia de usuario es fluida

---

## **🚀 ORDEN DE IMPLEMENTACIÓN RECOMENDADO**

1. ✅ Task 1: Modificar cards para mostrar nombreEmpresa
2. ✅ Task 2: Habilitar botón cercanía
3. ✅ Task 5: Crear función actualizarIndicadorOrdenamiento
4. ✅ Task 7: Agregar estilos CSS
5. ✅ Task 4: Implementar lógica botón cercanía
6. ✅ Task 6: Modificar botón fecha
7. ✅ Task 8: Modificar limpiar filtros
8. ✅ Tasks 9-14: Testing completo

---

**ESTADO FINAL: 100% FUNCIONAL SIN ERRORES** ✅
