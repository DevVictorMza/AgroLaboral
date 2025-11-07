# TODO LIST - FILTRO DE OFERTAS POR VIGENCIA EN DASHBOARD EMPRESA

## 📋 PROBLEMA IDENTIFICADO

Los botones de filtro "Todas", "Vigentes" y "Cerradas" en el dashboard de la empresa **NO están enviando el parámetro `vigente` al backend**, por lo que siempre cargan todas las ofertas y el filtrado se hace incorrectamente en el frontend.

### Endpoint Backend:
```
GET /privado/ofertas-empleo
GET /privado/ofertas-empleo?vigente=true   // Solo vigentes
GET /privado/ofertas-empleo?vigente=false  // Solo cerradas
```

### Controlador Spring Boot:
```java
@GetMapping
public ResponseEntity<List<OfertaEmpleoRespuestaPrivDTO>> listarPorEmpresa(
    Authentication authentication,
    @RequestParam(name = "vigente", required = false) Boolean vigente) {
    String cuit = authentication.getName();
    List<OfertaEmpleoRespuestaPrivDTO> respuesta = servicioOfertaEmpleo.listarPorEmpresa(cuit, vigente);
    return ResponseEntity.ok(respuesta);
}
```

### Comportamiento Actual (INCORRECTO):
- **Todas las opciones** llaman al endpoint sin parámetros: `/privado/ofertas-empleo`
- El backend retorna TODAS las ofertas (vigentes + cerradas)
- El filtrado se intenta hacer en frontend (ineficiente y posiblemente incorrecto)

### Comportamiento Esperado (CORRECTO):
- **"Todas"** → `/privado/ofertas-empleo` (sin parámetro)
- **"Vigentes"** → `/privado/ofertas-empleo?vigente=true`
- **"Cerradas"** → `/privado/ofertas-empleo?vigente=false`

---

## ✅ TAREAS A REALIZAR

### **FASE 1: MODIFICAR FUNCIÓN DE CARGA**

#### Task 1: Modificar función `cargarOfertasEmpleo(vigente)`
- **Archivo:** `js/app.js`
- **Línea aproximada:** 9555-9630
- **Problema:** La función NO construye la URL con el parámetro `vigente`
- **Código actual:**
  ```javascript
  let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);
  // Siempre llama a: http://localhost:8080/privado/ofertas-empleo
  ```
- **Código nuevo:**
  ```javascript
  // Construir URL con parámetro vigente si es necesario
  let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);
  
  // Agregar parámetro vigente solo si no es null
  if (vigente !== null) {
      endpoint += `?vigente=${vigente}`;
  }
  ```
- **Validación:** 
  - Llamar con `vigente=null` → `/privado/ofertas-empleo`
  - Llamar con `vigente=true` → `/privado/ofertas-empleo?vigente=true`
  - Llamar con `vigente=false` → `/privado/ofertas-empleo?vigente=false`

---

#### Task 2: Eliminar lógica de filtrado frontend innecesaria
- **Archivo:** `js/app.js`
- **Línea aproximada:** 9670
- **Problema:** Hay código que intenta filtrar en frontend después de recibir datos del backend
- **Acción:** 
  - Eliminar bloques de código que filtran por `vigente` después del fetch
  - El backend ya retorna las ofertas filtradas correctamente
- **Buscar y eliminar:**
  ```javascript
  // Código como este:
  if (vigente === true) {
      ofertas = ofertas.filter(o => o.vigente === true);
  } else if (vigente === false) {
      ofertas = ofertas.filter(o => o.vigente === false);
  }
  ```
- **Validación:** El backend hace el filtrado, no el frontend

---

### **FASE 2: VERIFICAR FUNCIÓN buildURL**

#### Task 3: Revisar función `buildURL()`
- **Archivo:** `js/app.js`
- **Ubicación:** Buscar definición de `buildURL`
- **Acción:** Verificar que la función construya correctamente las URLs base
- **Esperado:**
  ```javascript
  function buildURL(endpoint) {
      return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
      // Resultado: http://localhost:8080/privado/ofertas-empleo
  }
  ```
- **Validación:** La función solo construye la URL base, sin parámetros

---

### **FASE 3: ACTUALIZAR LOGS Y DEBUGGING**

#### Task 4: Actualizar logs de consola
- **Archivo:** `js/app.js`
- **Función:** `cargarOfertasEmpleo()`
- **Acción:** Actualizar los `console.log()` para mostrar la URL completa
- **Código actual:**
  ```javascript
  console.log(`🔄 Cargando TODAS las ofertas del backend...`);
  console.log(`   Endpoint: ${endpoint}`);
  ```
- **Código nuevo:**
  ```javascript
  const tipoFiltro = vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS';
  console.log(`🔄 Cargando ofertas: ${tipoFiltro}`);
  console.log(`   Endpoint completo: ${endpoint}`);
  console.log(`   Parámetro vigente: ${vigente}`);
  ```
- **Validación:** Los logs muestran claramente qué se está solicitando

---

#### Task 5: Actualizar mensaje de éxito
- **Archivo:** `js/app.js`
- **Función:** `cargarOfertasEmpleo()`
- **Línea aproximada:** 9617
- **Código actual:**
  ```javascript
  console.log(`✅ ${ofertas.length} ofertas cargadas desde backend`);
  console.log(`   Filtro aplicado: ${vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS'}`);
  ```
- **Código nuevo:**
  ```javascript
  const tipoFiltro = vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS';
  console.log(`✅ ${ofertas.length} ofertas ${tipoFiltro} cargadas desde backend`);
  ```
- **Validación:** Mensajes claros en consola

---

### **FASE 4: TESTING Y VALIDACIÓN**

#### Task 6: Test - Botón "Todas"
- **Acción:**
  1. Abrir dashboard de empresa
  2. Click en botón "Todas"
  3. Abrir DevTools → Network tab
  4. Verificar request:
     - URL: `http://localhost:8080/privado/ofertas-empleo`
     - Sin parámetros
  5. Verificar consola:
     - Log: "Cargando ofertas: TODAS"
     - Log: "Parámetro vigente: null"
  6. Verificar UI:
     - Muestra todas las ofertas (vigentes + cerradas)
     - Botón "Todas" marcado como activo
- **Esperado:** ✅ Carga todas las ofertas del backend

---

#### Task 7: Test - Botón "Vigentes"
- **Acción:**
  1. Click en botón "Vigentes"
  2. Verificar request en Network:
     - URL: `http://localhost:8080/privado/ofertas-empleo?vigente=true`
     - Parámetro: `vigente=true`
  3. Verificar consola:
     - Log: "Cargando ofertas: VIGENTES"
     - Log: "Parámetro vigente: true"
  4. Verificar UI:
     - Solo muestra ofertas vigentes
     - Botón "Vigentes" marcado como activo
     - Sin ofertas cerradas visibles
- **Esperado:** ✅ Carga solo ofertas vigentes del backend

---

#### Task 8: Test - Botón "Cerradas"
- **Acción:**
  1. Click en botón "Cerradas"
  2. Verificar request en Network:
     - URL: `http://localhost:8080/privado/ofertas-empleo?vigente=false`
     - Parámetro: `vigente=false`
  3. Verificar consola:
     - Log: "Cargando ofertas: CERRADAS"
     - Log: "Parámetro vigente: false"
  4. Verificar UI:
     - Solo muestra ofertas cerradas
     - Botón "Cerradas" marcado como activo
     - Sin ofertas vigentes visibles
- **Esperado:** ✅ Carga solo ofertas cerradas del backend

---

#### Task 9: Test - Alternancia entre filtros
- **Acción:**
  1. Click en "Vigentes"
  2. Verificar que carga ofertas vigentes
  3. Click en "Cerradas"
  4. Verificar que carga ofertas cerradas
  5. Click en "Todas"
  6. Verificar que carga todas las ofertas
  7. Verificar en Network que cada click hace un request diferente
- **Esperado:** ✅ Cada filtro hace su propio request al backend

---

#### Task 10: Test - Estado inicial del dashboard
- **Acción:**
  1. Abrir dashboard de empresa (recarga completa)
  2. Verificar estado inicial:
     - Botón "Vigentes" debe estar activo por defecto
     - Request inicial: `/privado/ofertas-empleo?vigente=true`
     - Solo muestra ofertas vigentes
- **Esperado:** ✅ Por defecto muestra ofertas vigentes

---

#### Task 11: Test - Manejo de respuestas vacías
- **Acción:**
  1. Si una empresa no tiene ofertas cerradas:
     - Click en "Cerradas"
     - Verificar mensaje: "No hay ofertas cerradas"
  2. Si una empresa no tiene ofertas vigentes:
     - Click en "Vigentes"
     - Verificar mensaje: "No hay ofertas vigentes"
- **Esperado:** ✅ Mensajes apropiados cuando no hay resultados

---

#### Task 12: Test - Errores del backend
- **Acción:**
  1. Simular backend caído (detener servidor Spring Boot)
  2. Click en cualquier filtro
  3. Verificar:
     - Mensaje de error apropiado
     - Estado de botones vuelve al anterior
     - No se queda en estado "loading" permanente
- **Esperado:** ✅ Manejo robusto de errores

---

## 📊 RESUMEN DE CAMBIOS

| Componente | Archivo | Línea | Modificación |
|------------|---------|-------|--------------|
| Construcción URL | `js/app.js` | ~9562 | Agregar parámetro `vigente` a la URL |
| Filtrado frontend | `js/app.js` | ~9670 | Eliminar filtrado innecesario |
| Logs debug | `js/app.js` | ~9563 | Mostrar URL completa en logs |
| Mensaje éxito | `js/app.js` | ~9617 | Actualizar mensaje de carga |

---

## 🎯 CÓDIGO ESPECÍFICO A MODIFICAR

### **Modificación Principal en `cargarOfertasEmpleo()`**

**ANTES (líneas 9555-9570):**
```javascript
// Guardar filtro actual
filtroActualOfertas = vigente;

// Construir URL - siempre sin parámetro para obtener todas las ofertas
// El filtrado se hará en el frontend
let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);

console.log(`🔄 Cargando TODAS las ofertas del backend...`);
console.log(`   Filtro a aplicar: ${vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS'}`);
console.log(`   Endpoint: ${endpoint}`);
```

**DESPUÉS:**
```javascript
// Guardar filtro actual
filtroActualOfertas = vigente;

// Construir URL base
let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);

// Agregar parámetro vigente si no es null (null = todas)
if (vigente !== null) {
    endpoint += `?vigente=${vigente}`;
}

const tipoFiltro = vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS';
console.log(`🔄 Cargando ofertas: ${tipoFiltro}`);
console.log(`   Endpoint completo: ${endpoint}`);
console.log(`   Parámetro vigente: ${vigente}`);
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

- [ ] Click en "Todas" → Request a `/privado/ofertas-empleo` (sin parámetros)
- [ ] Click en "Vigentes" → Request a `/privado/ofertas-empleo?vigente=true`
- [ ] Click en "Cerradas" → Request a `/privado/ofertas-empleo?vigente=false`
- [ ] El backend retorna solo las ofertas solicitadas
- [ ] No hay filtrado adicional en el frontend
- [ ] Los logs muestran la URL completa con parámetros
- [ ] El botón activo se marca visualmente
- [ ] El estado inicial es "Vigentes" activo
- [ ] Manejo correcto de respuestas vacías
- [ ] Manejo robusto de errores de red
- [ ] No hay errores en consola
- [ ] La alternancia entre filtros funciona correctamente

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

1. ✅ Task 1: Modificar construcción de URL en `cargarOfertasEmpleo()`
2. ✅ Task 2: Eliminar filtrado frontend innecesario
3. ✅ Task 4: Actualizar logs de debugging
4. ✅ Task 5: Actualizar mensaje de éxito
5. ✅ Tasks 6-12: Testing completo de todos los escenarios

---

**ESTADO FINAL: LISTO PARA IMPLEMENTACIÓN** ✅

**FECHA:** 07/11/2025  
**VERSIÓN:** 1.0  
**COMPLEJIDAD:** Baja (solo modificar construcción de URL)
