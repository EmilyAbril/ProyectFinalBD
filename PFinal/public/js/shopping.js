document.addEventListener('DOMContentLoaded', () => {
    const cartIcon = document.querySelector('.fa-basket-shopping');

    console.log('Script cargado y DOM completamente cargado');

    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }

    renderCart();
});

function addToCart(product) {
    // Enviar al servidor
    fetch('http://localhost:3000/cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_producto: product.id, cantidad: 1 })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Carrito actualizado en el servidor:', data);
        alert('Producto agregado al carrito');
        renderCart();
    })
    .catch(error => console.error('Error al actualizar el carrito en el servidor:', error));
}

function renderCart() {
    fetch('http://localhost:3000/cart-items')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(cart => {
            if (document.getElementById('cart-items')) {
                const cartContainer = document.getElementById('cart-items');
                const totalPriceElement = document.getElementById('total-price');
                cartContainer.innerHTML = '';
                let totalPrice = 0;

                cart.forEach(product => {
                    const productImage = `img/${product.NOMBRE.toLowerCase()}.png`; // Construir la URL de la imagen basada en el nombre del producto
                    const productElement = document.createElement('div');
                    productElement.classList.add('cart-item');
                    productElement.innerHTML = `
                        <img src="${productImage}" alt="${product.NOMBRE}" class="cart-item-image">
                        <div class="cart-item-details">
                            <h3>${product.NOMBRE}</h3>
                            <p>Cantidad: ${product.CANTIDAD}</p>
                            <p>Precio: $${product.PRECIO}MXN</p>
                        </div>
                        <div class="cart-item-actions">
                            <button class="remove-item" data-id="${product.ID_PRODUCTO}">Eliminar</button>
                        </div>
                    `;
                    cartContainer.appendChild(productElement);
                    totalPrice += product.PRECIO * product.CANTIDAD;
                });

                totalPriceElement.textContent = totalPrice;

                document.querySelectorAll('.remove-item').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const productId = e.currentTarget.dataset.id;
                        removeFromCart(productId);
                    });
                });
            }
        })
        .catch(error => console.error('Error al obtener los artículos del carrito:', error));
}

function removeFromCart(productId) {
    fetch(`http://localhost:3000/cart/${productId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Carrito actualizado en el servidor:', data);
        renderCart(); // Renderizar el carrito nuevamente después de eliminar el producto
    })
    .catch(error => console.error('Error al eliminar el producto del carrito en el servidor:', error));
}

document.addEventListener('DOMContentLoaded', function() {
    const userIcon = document.getElementById('user-icon');
    const userMenu = document.getElementById('user-menu');
    const logoutLink = document.getElementById('logout');

    userIcon.addEventListener('click', () => {
        if (userMenu.style.display === 'none' || userMenu.style.display === '') {
            userMenu.style.display = 'block';
        } else {
            userMenu.style.display = 'none';
        }
    });

    // Cerrar sesión
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        fetch('http://localhost:3000/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Redirigir a la página de inicio de sesión
            window.location.href = 'index.html';
        })
        .catch(error => console.error('Error al cerrar sesión:', error));
    });

    // Cerrar el menú si se hace clic fuera de él
    document.addEventListener('click', (e) => {
        if (!userIcon.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.style.display = 'none';
        }
    });
});

document.getElementById('checkout-button').addEventListener('click', () => {
    const total = document.getElementById('total-price').textContent;
    fetch('http://localhost:3000/purchase', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ total: total })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Compra realizada con éxito:', data);
        window.open('purchase.html', 'Compra', 'width=800,height=600');
    })
    .catch(error => console.error('Error al realizar la compra:', error));
});
