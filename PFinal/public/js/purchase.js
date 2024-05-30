document.addEventListener('DOMContentLoaded', function () {
    const purchasedItemsContainer = document.getElementById('purchased-items');
    const totalPriceElement = document.getElementById('total-price');
    const confirmPurchaseButton = document.getElementById('confirm-purchase');
    let totalPrice = 0;

    fetch('http://localhost:3000/cart-items')
        .then(response => response.json())
        .then(cartItems => {
            cartItems.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'cart-item';
                itemDiv.innerHTML = `
                    <div>${item.NOMBRE}</div>
                    <div>Cantidad: ${item.CANTIDAD}</div>
                    <div>Precio: $${item.PRECIO}MXN</div>
                `;
                purchasedItemsContainer.appendChild(itemDiv);
                totalPrice += item.PRECIO * item.CANTIDAD;
            });
            totalPriceElement.textContent = `$${totalPrice}MXN`;
        })
        .catch(error => console.error('Error al obtener los productos comprados:', error));

    confirmPurchaseButton.addEventListener('click', () => {
        fetch('http://localhost:3000/confirm-purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Compra confirmada:', data);
            alert('Compra confirmada');
            window.opener.location.reload(); // Recargar la página de cart.html
            window.close();
        })
        .catch(error => console.error('Error al confirmar la compra:', error));
    });
});
