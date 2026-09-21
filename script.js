
//Datos de los productos que se van a mostrar en la pagina con sus imagenes, precios y descripciones
const productos = [
  { id: 1, categoria: "bowls",     nombre: "Bowl Mediterráneo", descripcion: "Quinoa, pollo grillado, palta y hummus.", precio: 6990, imagen: "img/bowl-mediterraneo.jpg" },
  { id: 2, categoria: "bowls",     nombre: "Bowl Poke",         descripcion: "Arroz, salmón, edamame y pepino.",        precio: 7490, imagen: "img/bowl-poke.jpg" },
  { id: 3, categoria: "wraps",     nombre: "Wrap de Pollo",     descripcion: "Tortilla integral, pollo y verduras.",    precio: 4990, imagen: "img/wrap-pollo.jpg" },
  { id: 4, categoria: "wraps",     nombre: "Wrap Vegetariano",  descripcion: "Falafel, hummus y vegetales frescos.",    precio: 4790, imagen: "img/wrap-vegetariano.jpg" },
  { id: 5, categoria: "ensaladas", nombre: "Ensalada César",    descripcion: "Lechuga, pollo, crutones y parmesano.",   precio: 5490, imagen: "img/ensalada-cesar.jpg" },
  { id: 6, categoria: "ensaladas", nombre: "Ensalada Verde",    descripcion: "Espinaca, palta, nueces y semillas.",     precio: 5290, imagen: "img/ensalada-verde.jpg" }
];

//Elementos del HTML y utilidades
const contenedor   = document.querySelector("#lista-productos");
const dlgCarrito   = document.querySelector("#dlg-carrito");
const itemsCarrito = document.querySelector("#items-carrito");

//convierte los numeros en precios de forma CLP
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP'
    }).format(precio);
}

//carrito que guarda los productos que el usuario ha agregado
function cargarCarrito() {
    try {
        const guardado = JSON.parse(localStorage.getItem("carrito")) || [];
        return guardado.filter((item) =>
            productos.some((p) => p.id === item.id) && item.cantidad > 0
        );
    } catch (error) {
        return [];
    }
}
//se encarga de guardar los datos dentro del carrito en el local storage del navegador
function guardarCarrito() {
    try {
        localStorage.setItem("carrito", JSON.stringify(carrito));
    } catch (error) {
    }
}

let carrito = cargarCarrito();

//productos que se muestran en la pagina, dependiendo de la categoria que el usuario seleccione
function mostrarProductos(categoria = "todos") {
    contenedor.innerHTML = "";

    const lista = categoria === "todos"
        ? productos
        : productos.filter((p) => p.categoria === categoria);
    
    lista.forEach((p) => {
    contenedor.innerHTML += `
      <article class="tarjeta">
        <img class="tarjeta__imagen" src="${p.imagen}" alt="${p.nombre}" loading="lazy">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <p class="tarjeta__precio">${formatearPrecio(p.precio)}</p>
        <button class="btn-principal" data-agregar="${p.id}">Agregar</button>
      </article>
    `;
  });
}

//funcion que se encarga de agregar los productos al carrito
function agregarAlCarrito(id) {
    const existente = carrito.find((item) => item.id === id);

// Si el producto ya estaba en el carrito, aumentamos la cantidad. Si no, lo agregamos con cantidad 1.
  if (existente) {
    existente.cantidad++;               
  } else {
    carrito.push({ id: id, cantidad: 1 }); 
  }

  actualizarCarrito();
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find((i) => i.id === id);
  if (!item) return;

  item.cantidad += cambio;

  // Si la cantidad llega a 0, sacamos el producto del carrito
  carrito = carrito.filter((i) => i.cantidad > 0);

  actualizarCarrito();
}

// Vuelve a dibujar el carrito, el total y el contador
function actualizarCarrito() {
  let total = 0;
  let cantidadTotal = 0;

  if (carrito.length === 0) {
    itemsCarrito.innerHTML = '<p class="vacio">Tu carrito está vacío. Agrega un plato del menú.</p>';
  } else {
    itemsCarrito.innerHTML = carrito.map((item) => {
      const p = productos.find((prod) => prod.id === item.id);
      const subtotal = p.precio * item.cantidad;

      total += subtotal;
      cantidadTotal += item.cantidad;

      return `
        <div class="item">
          <strong>${p.nombre}</strong>
          <span>${formatearPrecio(subtotal)}</span>
          <div class="item__controles">
            <button type="button" data-restar="${item.id}" aria-label="Quitar uno">−</button>
            <span>${item.cantidad}</span>
            <button type="button" data-sumar="${item.id}" aria-label="Agregar uno">+</button>
          </div>
        </div>
      `;
    }).join("");
  }

  document.querySelector("#total-carrito").textContent = formatearPrecio(total);
  document.querySelector("#contador-carrito").textContent = cantidadTotal;
  document.querySelector("#btn-vaciar").disabled = carrito.length === 0;

  guardarCarrito();
}

// Botones "Agregar" de las tarjetas
contenedor.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-agregar]");
  if (boton) {
    agregarAlCarrito(Number(boton.dataset.agregar));
  }
});

// Botones + y − dentro del carrito
itemsCarrito.addEventListener("click", (evento) => {
  const sumar  = evento.target.closest("[data-sumar]");
  const restar = evento.target.closest("[data-restar]");

  if (sumar)  cambiarCantidad(Number(sumar.dataset.sumar), 1);
  if (restar) cambiarCantidad(Number(restar.dataset.restar), -1);
});

// Vaciar el carrito
document.querySelector("#btn-vaciar").addEventListener("click", () => {
  carrito = [];
  actualizarCarrito();
});

// Abrir el carrito con el botón 
document.querySelector("#btn-carrito").addEventListener("click", () => {
  dlgCarrito.showModal();
});

// Cerrar cualquier ventana con la ✕ o haciendo clic en el fondo oscuro
document.querySelectorAll("dialog").forEach((dialogo) => {
  dialogo.addEventListener("click", (evento) => {
    const clicEnFondo  = evento.target === dialogo;
    const clicEnCerrar = evento.target.closest("[data-cerrar]");
    if (clicEnFondo || clicEnCerrar) dialogo.close();
  });
});

// Filtros: Todos / Bowls / Wraps / Ensaladas
const filtros = document.querySelector(".filtros");

if (filtros) {
  filtros.addEventListener("click", (evento) => {
    const boton = evento.target.closest(".filtro");
    if (!boton) return;

    document.querySelectorAll(".filtro").forEach((b) => b.classList.remove("activo"));
    boton.classList.add("activo");

    mostrarProductos(boton.dataset.categoria);
  });
}

// Flecha ↑ del móvil: volver arriba
document.querySelector("#btn-subir").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

mostrarProductos();
actualizarCarrito();

const dlgLogin  = document.querySelector("#dlg-login");
const formLogin = document.querySelector("#form-login");
const btnLogin  = document.querySelector("#btn-login");

// Leer y guardar el usuario en el navegador
function cargarUsuario() {
  try {
    return JSON.parse(localStorage.getItem("usuario"));
  } catch (error) {
    return null;
  }
}

function guardarUsuario() {
  try {
    if (usuario) {
      localStorage.setItem("usuario", JSON.stringify(usuario));
    } else {
      localStorage.removeItem("usuario");
    }
  } catch (error) {
  }
}

let usuario = cargarUsuario();   // null si nadie ha iniciado sesión

// El botón dice "Log In" o "Hola, nombre · Salir" según el caso
function actualizarBotonLogin() {
  btnLogin.textContent = usuario ? "Hola, " + usuario.nombre + " · Salir" : "Log In";
}

// Clic en el botón: si hay sesión, la cierra; si no, abre el formulario
btnLogin.addEventListener("click", () => {
  if (usuario) {
    usuario = null;
    guardarUsuario();
    actualizarBotonLogin();
  } else {
    dlgLogin.showModal();
  }
});

// Al enviar el formulario
formLogin.addEventListener("submit", (evento) => {
  evento.preventDefault();   // evita que la página se recargue

  const correo = document.querySelector("#correo").value.trim();
  const nombre = correo.split("@")[0];   // "mimi@correo.cl" -> "mimi"

  usuario = { correo: correo, nombre: nombre };
  guardarUsuario();
  actualizarBotonLogin();

  formLogin.reset();   // limpia los campos
  dlgLogin.close();
});

actualizarBotonLogin();
