# PROMPT PROFESIONAL - FILTRO DE OFERTAS POR VIGENCIA EN DASHBOARD EMPRESA

---

## 🎯 CONTEXTO DEL PROYECTO

Estamos desarrollando **AgroLaboral**, una plataforma web para gestión de ofertas de empleo agrícola en Mendoza. El sistema tiene un **dashboard privado** para empresas donde pueden ver y gestionar sus ofertas de empleo.

---

## 📋 PROBLEMA ACTUAL

En el dashboard de la empresa, hay tres botones de filtro:
- **"Todas"** - Debe mostrar todas las ofertas (vigentes + cerradas)
- **"Vigentes"** - Debe mostrar solo ofertas vigentes
- **"Cerradas"** - Debe mostrar solo ofertas cerradas

**PROBLEMA:** Los botones NO están enviando el parámetro `vigente` al backend, por lo que **siempre cargan todas las ofertas** y el filtrado se intenta hacer incorrectamente en el frontend.

---

## 🔧 ESPECIFICACIONES TÉCNICAS

### **Backend Endpoint**

El controlador Spring Boot está correctamente implementado:

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

### **URLs Esperadas**

| Filtro | URL | Parámetro |
|--------|-----|-----------|
| **Todas** | `http://localhost:8080/privado/ofertas-empleo` | Ninguno (null) |
| **Vigentes** | `http://localhost:8080/privado/ofertas-empleo?vigente=true` | `vigente=true` |
| **Cerradas** | `http://localhost:8080/privado/ofertas-empleo?vigente=false` | `vigente=false` |

### **Comportamiento del Backend**

- **Sin parámetro** (`vigente=null`) → Retorna **todas las ofertas** (vigentes + cerradas)
- **Con `vigente=true`** → Retorna **solo ofertas vigentes**
- **Con `vigente=false`** → Retorna **solo ofertas cerradas**

---

## 📁 ESTRUCTURA DE ARCHIVOS

```
proyecto cepas laborales/
├── js/
│   └── app.js                    # Archivo principal (12,196 líneas)
│       ├── cargarOfertasEmpleo()        # Línea ~9555 (MODIFICAR)
│       ├── aplicarFiltroOfertas()       # Línea ~10445 (OK)
│       └── Botones HTML inline          # Línea ~1200 (OK)
```

---

## 🎨 CAMBIO PRINCIPAL: MODIFICAR `cargarOfertasEmpleo(vigente)`

### **Ubicación del código**

**Archivo:** `js/app.js`  
**Función:** `cargarOfertasEmpleo(vigente)`  
**Línea aproximada:** 9555-9630

---

### **Código ACTUAL (INCORRECTO):**

```javascript
async function cargarOfertasEmpleo(vigente = null) {
    try {
        // Guardar filtro actual
        filtroActualOfertas = vigente;

        // Construir URL - siempre sin parámetro para obtener todas las ofertas
        // El filtrado se hará en el frontend
        let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);

        console.log(`🔄 Cargando TODAS las ofertas del backend...`);
        console.log(`   Filtro a aplicar: ${vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS'}`);
        console.log(`   Endpoint: ${endpoint}`);

        // Usar fetchWithAuth que ya maneja la autenticación
        const response = await fetchWithAuth(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // ... resto del código (manejo de errores, parsing, etc.)
        
        const ofertas = await response.json();
        
        // Guardar en cache
        ofertasCache = ofertas;

        console.log(`✅ ${ofertas.length} ofertas cargadas desde backend`);
        console.log(`   Filtro aplicado: ${vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS'}`);

        // Mostrar contenido y renderizar ofertas
        mostrarEstadoOfertas('content');
        renderizarOfertas(ofertas);

    } catch (error) {
        console.error('❌ Error cargando ofertas:', error);
        mostrarEstadoOfertas('error');
        mostrarErrorEspecificoOfertas(error.message);
    }
}
```

**PROBLEMA:** La línea `let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);` NO agrega el parámetro `vigente` a la URL.

---

### **Código MODIFICADO (CORRECTO):**

```javascript
async function cargarOfertasEmpleo(vigente = null) {
    try {
        // Guardar filtro actual
        filtroActualOfertas = vigente;

        // Construir URL base
        let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);

        // Agregar parámetro vigente si no es null (null = todas las ofertas)
        if (vigente !== null) {
            endpoint += `?vigente=${vigente}`;
        }

        const tipoFiltro = vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS';
        console.log(`🔄 Cargando ofertas: ${tipoFiltro}`);
        console.log(`   Endpoint completo: ${endpoint}`);
        console.log(`   Parámetro vigente: ${vigente}`);

        // Usar fetchWithAuth que ya maneja la autenticación
        const response = await fetchWithAuth(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // ... (manejo de errores permanece igual)
        
        const ofertas = await response.json();
        
        // Guardar en cache
        ofertasCache = ofertas;

        console.log(`✅ ${ofertas.length} ofertas ${tipoFiltro} cargadas desde backend`);

        // Mostrar contenido y renderizar ofertas
        mostrarEstadoOfertas('content');
        renderizarOfertas(ofertas);

    } catch (error) {
        console.error('❌ Error cargando ofertas:', error);
        mostrarEstadoOfertas('error');
        mostrarErrorEspecificoOfertas(error.message);
    }
}
```

---

## 🔍 CAMBIOS ESPECÍFICOS

### **Cambio 1: Construcción de URL (CRÍTICO)**

**ANTES:**
```javascript
// Construir URL - siempre sin parámetro para obtener todas las ofertas
// El filtrado se hará en el frontend
let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);
```

**DESPUÉS:**
```javascript
// Construir URL base
let endpoint = buildURL(OFERTAS_CONFIG.ENDPOINT);

// Agregar parámetro vigente si no es null (null = todas las ofertas)
if (vigente !== null) {
    endpoint += `?vigente=${vigente}`;
}
```

**Explicación:**
- Si `vigente === null` → URL: `/privado/ofertas-empleo` (todas)
- Si `vigente === true` → URL: `/privado/ofertas-empleo?vigente=true` (solo vigentes)
- Si `vigente === false` → URL: `/privado/ofertas-empleo?vigente=false` (solo cerradas)

---

### **Cambio 2: Logs de Debug (RECOMENDADO)**

**ANTES:**
```javascript
console.log(`🔄 Cargando TODAS las ofertas del backend...`);
console.log(`   Filtro a aplicar: ${vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS'}`);
console.log(`   Endpoint: ${endpoint}`);
```

**DESPUÉS:**
```javascript
const tipoFiltro = vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS';
console.log(`🔄 Cargando ofertas: ${tipoFiltro}`);
console.log(`   Endpoint completo: ${endpoint}`);
console.log(`   Parámetro vigente: ${vigente}`);
```

**Beneficio:** Muestra claramente la URL completa con parámetros para debugging.

---

### **Cambio 3: Mensaje de Éxito (RECOMENDADO)**

**ANTES:**
```javascript
console.log(`✅ ${ofertas.length} ofertas cargadas desde backend`);
console.log(`   Filtro aplicado: ${vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS'}`);
```

**DESPUÉS:**
```javascript
const tipoFiltro = vigente === null ? 'TODAS' : vigente === true ? 'VIGENTES' : 'CERRADAS';
console.log(`✅ ${ofertas.length} ofertas ${tipoFiltro} cargadas desde backend`);
```

**Beneficio:** Mensaje más conciso y claro.

---

## 🚫 QUÉ NO MODIFICAR

### **Función `buildURL()` - NO TOCAR**

Esta función solo construye la URL base:
```javascript
function buildURL(endpoint) {
    return `${BACKEND_CONFIG.BASE_URL}${endpoint}`;
    // Resultado: http://localhost:8080/privado/ofertas-empleo
}
```

**NO agregar lógica de parámetros aquí.** Los parámetros se agregan DESPUÉS de llamar a esta función.

---

### **Función `aplicarFiltroOfertas()` - ESTÁ OK**

Esta función ya funciona correctamente (línea ~10445):
```javascript
async function aplicarFiltroOfertas(filtro) {
    // ... manejo de loading ...
    await cargarOfertasEmpleo(filtro);  // ✅ Llama correctamente con el parámetro
    // ... actualización de UI ...
}
```

**NO requiere modificaciones.**

---

### **Botones HTML - ESTÁN OK**

Los botones ya llaman correctamente a la función (línea ~1200):
```html
<button onclick="aplicarFiltroOfertas(null)">Todas</button>
<button onclick="aplicarFiltroOfertas(true)">Vigentes</button>
<button onclick="aplicarFiltroOfertas(false)">Cerradas</button>
```

**NO requieren modificaciones.**

---

## ✅ TESTING Y VALIDACIÓN

### **Test 1: Botón "Todas"**

**Pasos:**
1. Abrir dashboard de empresa
2. Click en botón "Todas"
3. Abrir DevTools → pestaña Network
4. Buscar request a `/privado/ofertas-empleo`

**Verificar:**
- ✅ URL: `http://localhost:8080/privado/ofertas-empleo` (sin parámetros)
- ✅ Consola muestra: "Cargando ofertas: TODAS"
- ✅ Consola muestra: "Parámetro vigente: null"
- ✅ Botón "Todas" marcado como activo
- ✅ Se muestran todas las ofertas (vigentes + cerradas)

---

### **Test 2: Botón "Vigentes"**

**Pasos:**
1. Click en botón "Vigentes"
2. Verificar en Network tab

**Verificar:**
- ✅ URL: `http://localhost:8080/privado/ofertas-empleo?vigente=true`
- ✅ Query Params: `vigente: true`
- ✅ Consola muestra: "Cargando ofertas: VIGENTES"
- ✅ Consola muestra: "Parámetro vigente: true"
- ✅ Botón "Vigentes" marcado como activo
- ✅ Solo se muestran ofertas vigentes
- ✅ NO aparecen ofertas cerradas

---

### **Test 3: Botón "Cerradas"**

**Pasos:**
1. Click en botón "Cerradas"
2. Verificar en Network tab

**Verificar:**
- ✅ URL: `http://localhost:8080/privado/ofertas-empleo?vigente=false`
- ✅ Query Params: `vigente: false`
- ✅ Consola muestra: "Cargando ofertas: CERRADAS"
- ✅ Consola muestra: "Parámetro vigente: false"
- ✅ Botón "Cerradas" marcado como activo
- ✅ Solo se muestran ofertas cerradas
- ✅ NO aparecen ofertas vigentes

---

### **Test 4: Alternancia entre filtros**

**Pasos:**
1. Click en "Vigentes" → verificar request
2. Click en "Cerradas" → verificar request
3. Click en "Todas" → verificar request
4. Repetir ciclo

**Verificar:**
- ✅ Cada click hace un nuevo request al backend
- ✅ Las URLs cambian correctamente
- ✅ Solo un botón está activo a la vez
- ✅ Los datos mostrados corresponden al filtro activo

---

### **Test 5: Estado inicial**

**Pasos:**
1. Recargar página completamente (F5)
2. Abrir dashboard de empresa
3. Verificar estado inicial

**Verificar:**
- ✅ Botón "Vigentes" activo por defecto
- ✅ Request inicial: `/privado/ofertas-empleo?vigente=true`
- ✅ Solo muestra ofertas vigentes al cargar

---

### **Test 6: Respuesta vacía**

**Pasos:**
1. Si una empresa no tiene ofertas cerradas:
   - Click en "Cerradas"
   - Verificar mensaje apropiado

**Verificar:**
- ✅ Request se hace correctamente: `?vigente=false`
- ✅ Backend retorna array vacío: `[]`
- ✅ Se muestra mensaje: "No hay ofertas cerradas"
- ✅ No hay errores en consola

---

### **Test 7: Consola de desarrollador**

**Ejemplo de logs esperados al hacer click en "Vigentes":**

```
🔄 Cargando ofertas: VIGENTES
   Endpoint completo: http://localhost:8080/privado/ofertas-empleo?vigente=true
   Parámetro vigente: true
✅ 5 ofertas VIGENTES cargadas desde backend
```

**Ejemplo de logs al hacer click en "Todas":**

```
🔄 Cargando ofertas: TODAS
   Endpoint completo: http://localhost:8080/privado/ofertas-empleo
   Parámetro vigente: null
✅ 8 ofertas TODAS cargadas desde backend
```

---

## 🚨 PUNTOS CRÍTICOS

### **1. Uso correcto de `vigente !== null`**

```javascript
if (vigente !== null) {
    endpoint += `?vigente=${vigente}`;
}
```

**¿Por qué `!== null` y no `!== undefined`?**
- La función recibe `null` explícitamente cuando se quiere todas las ofertas
- `false` es un valor válido (ofertas cerradas)
- `null` es el único valor que indica "sin filtro"

---

### **2. Conversión correcta a string**

```javascript
endpoint += `?vigente=${vigente}`;
```

**Conversión automática:**
- `vigente=true` → URL: `?vigente=true` (string "true")
- `vigente=false` → URL: `?vigente=false` (string "false")

Spring Boot convierte automáticamente estos strings al tipo `Boolean` en el parámetro del controlador.

---

### **3. NO filtrar en frontend**

**ELIMINAR cualquier código como este:**
```javascript
// ❌ NO HACER ESTO
if (vigente === true) {
    ofertas = ofertas.filter(o => o.vigente === true);
}
```

**Razón:** El backend ya retorna las ofertas filtradas. Filtrar nuevamente en frontend es:
- Ineficiente
- Redundante
- Puede causar bugs si la lógica difiere del backend

---

## 📊 RESULTADO FINAL ESPERADO

### **DevTools Network Tab:**

| Filtro | Request URL |
|--------|-------------|
| Todas | `http://localhost:8080/privado/ofertas-empleo` |
| Vigentes | `http://localhost:8080/privado/ofertas-empleo?vigente=true` |
| Cerradas | `http://localhost:8080/privado/ofertas-empleo?vigente=false` |

### **Consola del Navegador:**

```
🔄 Cargando ofertas: VIGENTES
   Endpoint completo: http://localhost:8080/privado/ofertas-empleo?vigente=true
   Parámetro vigente: true
✅ 5 ofertas VIGENTES cargadas desde backend
```

### **UI del Dashboard:**

- ✅ Botón activo marcado visualmente (clase `active`)
- ✅ Solo ofertas del tipo seleccionado visibles
- ✅ Contador actualizado: "5 ofertas vigentes"
- ✅ Sin errores en consola

---

## 🎯 CRITERIOS DE ÉXITO

- [ ] Click en "Todas" → Request sin parámetros
- [ ] Click en "Vigentes" → Request con `?vigente=true`
- [ ] Click en "Cerradas" → Request con `?vigente=false`
- [ ] Backend retorna solo las ofertas solicitadas
- [ ] No hay filtrado adicional en frontend
- [ ] Logs muestran URL completa con parámetros
- [ ] Alternancia entre filtros funciona correctamente
- [ ] Estado inicial es "Vigentes"
- [ ] Manejo correcto de respuestas vacías
- [ ] Cero errores en consola

---

**DOCUMENTO CREADO:** 07/11/2025  
**VERSIÓN:** 1.0  
**ESTADO:** Listo para implementación ✅  
**COMPLEJIDAD:** Baja (modificación de 3 líneas de código)
