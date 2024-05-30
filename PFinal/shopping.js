document.addEventListener('DOMContentLoaded', () => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const addCartButtons = document.querySelectorAll('.add-cart');
    const cartIcon = document.querySelector('.fa-basket-shopping');

    if (addCartButtons) {
        addCartButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                console.log('Botón de agregar al carrito clicado'); // Log para verificar que se hizo clic
                const productId = e.currentTarget.dataset.id;
                const productName = e.currentTarget.dataset.name;
                const productPrice = parseInt(e.currentTarget.dataset.price, 10);
                const productImage = e.currentTarget.dataset.image;

                const product = {
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                };

                addToCart(product);
            });
        });
    }

    if (cartIcon) {
        cartIcon.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    }

    function addToCart(product) {
        const existingProduct = cart.find(item => item.id === product.id);

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            cart.push(product);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        console.log('Producto agregado al carrito:', product); // Log para verificar el producto agregado
        console.log('Contenido del carrito:', cart); // Log para verificar el contenido del carrito
        alert('Producto agregado al carrito');

        // Enviar al servidor
        fetch('http://localhost:3000/cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_producto: product.id, cantidad: product.quantity })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => console.log('Carrito actualizado en el servidor:', data))
        .catch(error => console.error('Error al actualizar el carrito en el servidor:', error));
    }

    function renderCart() {
        if (document.getElementById('cart-items')) {
            const cartContainer = document.getElementById('cart-items');
            const totalPriceElement = document.getElementById('total-price');
            cartContainer.innerHTML = '';
            let totalPrice = 0;

            cart.forEach(product => {
                const productElement = document.createElement('div');
                productElement.classList.add('cart-item');
                productElement.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h3>${product.name}</h3>
                        <p>Cantidad: ${product.quantity}</p>
                        <p>Precio: $${product.price}MXN</p>
                    </div>
                    <div class="cart-item-actions">
                        <button class="remove-item" data-id="${product.id}">Eliminar</button>
                    </div>
                `;
                cartContainer.appendChild(productElement);
                totalPrice += product.price * product.quantity;
            });

            totalPriceElement.textContent = totalPrice;

            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', (e) => {
                    const productId = e.currentTarget.dataset.id;
                    removeFromCart(productId);
                });
            });
        }
    }

    function removeFromCart(productId) {
        const productIndex = cart.findIndex(item => item.id === productId);
        if (productIndex !== -1) {
            cart.splice(productIndex, 1);
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();

            // Enviar al servidor
            fetch(`http://localhost:3000/cart/${productId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => console.log('Carrito actualizado en el servidor:', data))
            .catch(error => console.error('Error al eliminar el producto del carrito en el servidor:', error));
        }
    }

    renderCart();
});
