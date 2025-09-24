	// Cargar distritos según el departamento seleccionado
	function cargarDistritosPorDepartamento(idDepartamento) {
		const select = document.getElementById('distrito');
		if (!select || !idDepartamento) {
			select.innerHTML = '<option value="">Seleccionar distrito</option>';
			return;
		}
		select.innerHTML = '<option value="">Cargando distritos...</option>';
		fetch(`http://localhost:9090/distritos/departamento/${idDepartamento}`)
			.then(res => res.json())
			.then(data => {
				select.innerHTML = '<option value="">Seleccionar distrito</option>';
				data.forEach(dist => {
					const value = dist.idDistrito;
					const label = dist.nombreDistrito;
					const opt = document.createElement('option');
					opt.value = value;
					opt.textContent = label;
					select.appendChild(opt);
				});
			})
			.catch(() => {
				select.innerHTML = '<option value="">No se pudieron cargar los distritos</option>';
			});
	}
	// Cargar departamentos desde endpoint y poblar el select
	function cargarDepartamentos() {
		const select = document.getElementById('departamento');
		if (!select) return;
		select.innerHTML = '<option value="">Cargando departamentos...</option>';
		fetch('http://localhost:9090/departamentos')
			.then(res => res.json())
			.then(data => {
				select.innerHTML = '<option value="">Seleccionar departamento</option>';
				data.forEach(dep => {
					const value = dep.idDepartamento;
					const label = dep.nombreDepartamento;
					const opt = document.createElement('option');
					opt.value = value;
					opt.textContent = label;
					select.appendChild(opt);
				});
				// Registrar evento change cada vez que se repuebla el select
				select.onchange = function() {
					cargarDistritosPorDepartamento(this.value);
				};
			})
			.catch(() => {
				select.innerHTML = '<option value="">No se pudieron cargar los departamentos</option>';
			});
	}

// Inicializar el mapa principal de la página (no el del wizard)
document.addEventListener('DOMContentLoaded', function() {
	var map = L.map('map').setView([-32.89, -68.83], 8); // Mendoza
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 18,
		attribution: '© OpenStreetMap contributors'
	}).addTo(map);

	// --- Lógica del wizard de registro de empleador ---
	const paso1 = document.getElementById('form-registro-empleador-paso1');
	const paso2 = document.getElementById('form-registro-empleador-paso2');
	const paso3 = document.getElementById('form-registro-empleador-paso3');
	const paso5 = document.getElementById('form-registro-empleador-paso5');
	const btnSiguiente1 = document.getElementById('btn-siguiente-paso1');
	const btnAnterior2 = document.getElementById('btn-anterior-paso2');
	const btnSiguiente2 = document.getElementById('btn-siguiente-paso2');
	const btnAnterior3 = document.getElementById('btn-anterior-paso3');
	const btnSiguiente3 = document.getElementById('btn-siguiente-paso3');
	const btnAnterior5 = document.getElementById('btn-anterior-paso5');

	if (btnSiguiente1) {
		btnSiguiente1.addEventListener('click', function() {
			const cuitInput = document.getElementById('cuit');
			const razonInput = document.getElementById('razonSocial');
			const cuitValue = cuitInput.value.trim();
			const razonValue = razonInput.value.trim();
			let errorMsg = '';
			// Validar CUIT obligatorio y formato
			if (!cuitValue) {
				errorMsg = 'El campo CUIT es obligatorio.';
			} else if (!(/^\d{11}$/.test(cuitValue))) {
				errorMsg = 'El CUIT debe tener exactamente 11 números.';
			}
			// Validar Razón Social obligatorio
			let razonErrorMsg = '';
			if (!razonValue) {
				razonErrorMsg = 'El campo Razón Social es obligatorio.';
			}
			// Mostrar error CUIT
			let errorDiv = document.getElementById('cuit-error');
			if (!errorDiv) {
				errorDiv = document.createElement('div');
				errorDiv.id = 'cuit-error';
				errorDiv.className = 'text-danger mt-1';
				cuitInput.parentNode.appendChild(errorDiv);
			}
			if (errorMsg) {
				errorDiv.textContent = errorMsg;
				cuitInput.classList.add('is-invalid');
				cuitInput.focus();
			} else {
				errorDiv.textContent = '';
				cuitInput.classList.remove('is-invalid');
			}
			// Mostrar error Razón Social
			let razonErrorDiv = document.getElementById('razonSocial-error');
			if (!razonErrorDiv) {
				razonErrorDiv = document.createElement('div');
				razonErrorDiv.id = 'razonSocial-error';
				razonErrorDiv.className = 'text-danger mt-1';
				razonInput.parentNode.appendChild(razonErrorDiv);
			}
			if (razonErrorMsg) {
				razonErrorDiv.textContent = razonErrorMsg;
				razonInput.classList.add('is-invalid');
				if (!errorMsg) razonInput.focus();
			} else {
				razonErrorDiv.textContent = '';
				razonInput.classList.remove('is-invalid');
			}
			// Si hay algún error, no avanzar
			if (errorMsg || razonErrorMsg) return;
			paso1.classList.add('d-none');
			paso2.classList.remove('d-none');
		});
		// Solo permitir números y máximo 11 caracteres en el input CUIT
		const cuitInput = document.getElementById('cuit');
		if (cuitInput) {
			cuitInput.addEventListener('input', function() {
				this.value = this.value.replace(/\D/g, '').slice(0, 11);
			});
		}
		// Forzar mayúsculas en Razón Social
		const razonInput = document.getElementById('razonSocial');
		if (razonInput) {
			razonInput.addEventListener('input', function() {
				this.value = this.value.toUpperCase();
			});
		}
	}
	if (btnAnterior2) {
		btnAnterior2.addEventListener('click', function() {
			paso2.classList.add('d-none');
			paso1.classList.remove('d-none');
		});
	}
	if (btnSiguiente2) {
		btnSiguiente2.addEventListener('click', function() {
			paso2.classList.add('d-none');
			paso3.classList.remove('d-none');
			setTimeout(function() {
				initEstablecimientoMap();
				cargarEspecies();
				cargarDepartamentos();
				// Limpiar distritos al entrar al paso 3
				const distritoSelect = document.getElementById('distrito');
				if (distritoSelect) {
					distritoSelect.innerHTML = '<option value="">Seleccionar distrito</option>';
				}
			}, 200); // Espera a que el modal renderice
		});
	}
	// ...existing code...
	if (btnAnterior3) {
		btnAnterior3.addEventListener('click', function() {
			paso3.classList.add('d-none');
			paso2.classList.remove('d-none');
		});
	}
	if (btnSiguiente3) {
		btnSiguiente3.addEventListener('click', function() {
			paso3.classList.add('d-none');
			paso5.classList.remove('d-none');
			llenarConfirmacion();
		});
	}
	if (btnAnterior5) {
		btnAnterior5.addEventListener('click', function() {
			paso5.classList.add('d-none');
			paso3.classList.remove('d-none');
		});
	}

	// Inicialización del mapa de geolocalización para el paso 3 del wizard
	let establecimientoMap = null;
	function initEstablecimientoMap() {
		if (establecimientoMap) {
			establecimientoMap.invalidateSize();
			return;
		}
		establecimientoMap = L.map('establecimiento-map').setView([-32.8908, -68.8272], 10); // Mendoza por defecto
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 19,
			attribution: '© OpenStreetMap'
		}).addTo(establecimientoMap);
		let marker = null;
		establecimientoMap.on('click', function(e) {
			const { lat, lng } = e.latlng;
			document.getElementById('latitud').value = lat.toFixed(6);
			document.getElementById('longitud').value = lng.toFixed(6);
			if (marker) {
				marker.setLatLng(e.latlng);
			} else {
				marker = L.marker(e.latlng).addTo(establecimientoMap);
			}
		});
	}

	// Cargar especies desde endpoint y poblar dropdown con checkboxes
	function cargarEspecies() {
		const especiesList = document.getElementById('especies-list');
		const especiesInput = document.getElementById('especies');
		const dropdownBtn = document.getElementById('dropdownEspecies');
		if (!especiesList || !especiesInput || !dropdownBtn) return;
		especiesList.innerHTML = '<li class="px-3 py-2 text-muted">Cargando especies...</li>';
		fetch('http://localhost:9090/especies')
			.then(res => res.json())
			.then(data => {
				if (!Array.isArray(data) || data.length === 0) {
					especiesList.innerHTML = '<li class="px-3 py-2 text-danger">No hay especies disponibles</li>';
					return;
				}
				especiesList.innerHTML = '';
				data.forEach(especie => {
					const id = especie.idEspecie;
					const nombre = especie.nombreEspecie;
					const li = document.createElement('li');
					li.className = 'px-3 py-1';
					li.innerHTML = `
						<div class="form-check">
							<input class="form-check-input" type="checkbox" value="${id}" id="chk-especie-${id}">
							<label class="form-check-label" for="chk-especie-${id}">${nombre}</label>
						</div>
					`;
					especiesList.appendChild(li);
				});

				// Manejar selección múltiple
				especiesList.querySelectorAll('input[type=checkbox]').forEach(cb => {
					cb.addEventListener('change', function() {
						const checked = Array.from(especiesList.querySelectorAll('input[type=checkbox]:checked'));
						const values = checked.map(cb => cb.value);
						const labels = checked.map(cb => cb.parentElement.querySelector('label').textContent);
						especiesInput.value = values.join(',');
						dropdownBtn.textContent = labels.length ? labels.join(', ') : 'Seleccionar especies';
					});
				});
			})
			.catch(() => {
				especiesList.innerHTML = '<li class="px-3 py-2 text-danger">No se pudieron cargar las especies</li>';
			});
	}

	// Llenar lista de confirmación
	function llenarConfirmacion() {
		const lista = document.getElementById('confirmacion-lista');
		if (!lista) return;
		lista.innerHTML = '';
		// Paso 1
		lista.innerHTML += `<li class='list-group-item'><b>CUIT:</b> ${document.getElementById('cuit').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Razón Social:</b> ${document.getElementById('razonSocial').value}</li>`;
		// Paso 2
		lista.innerHTML += `<li class='list-group-item'><b>DNI:</b> ${document.getElementById('dni').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Nombre:</b> ${document.getElementById('nombre').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Apellido:</b> ${document.getElementById('apellido').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Email:</b> ${document.getElementById('email').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Teléfono:</b> ${document.getElementById('telefono').value}</li>`;
		// Paso 3
		lista.innerHTML += `<li class='list-group-item'><b>Nombre Establecimiento:</b> ${document.getElementById('nombreEstablecimiento').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Número de RENSPA:</b> ${document.getElementById('renspa').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Especies:</b> ${document.getElementById('especies').selectedOptions[0]?.textContent || ''}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Departamento:</b> ${document.getElementById('departamento').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Distrito:</b> ${document.getElementById('distrito').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Calle:</b> ${document.getElementById('calle').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Numeración:</b> ${document.getElementById('numeracion').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Código Postal:</b> ${document.getElementById('codigoPostal').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Latitud:</b> ${document.getElementById('latitud').value}</li>`;
		lista.innerHTML += `<li class='list-group-item'><b>Longitud:</b> ${document.getElementById('longitud').value}</li>`;
	}
});
