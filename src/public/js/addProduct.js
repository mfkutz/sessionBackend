
document.addEventListener('DOMContentLoaded', async () => {
    const selectCart = document.getElementById('cartSelect')
    const newCartButton = document.getElementById('newCartButton')
    const addToCartButtons = document.querySelectorAll('.btn_cart')
    const cartlink = document.getElementById('cartlink')

    await loadCarts()

    newCartButton.addEventListener('click', createNewCart)

    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart)
    })

    selectCart.addEventListener('change', () => {
        updateCartLink(selectCart.value)
    })

    async function loadCarts() {
        try {
            const response = await fetch('/api/carts')
            if (!response.ok) {
                throw new Error('Error al cargar los carritos')
            }
            const data = await response.json()
            populateCartSelect(data.carts)
            updateCartLink(data.carts[0]._id)
        } catch (error) {
            console.error('Error:', error)
            alert('Se produjo un error al cargar los carritos.')
        }
    }

    function populateCartSelect(carts) {
        selectCart.innerHTML = ''
        const defaultOption = document.createElement('option')
        /* defaultOption.text = 'Seleccione un carrito' */
        defaultOption.disabled = true
        selectCart.add(defaultOption)
        carts.forEach(cart => {
            const option = document.createElement('option')
            option.value = cart._id
            option.text = cart._id
            selectCart.add(option)
        })

        if (carts.length === 0) {
            selectCart.style.display = 'none'
            const messageElement = document.createElement('p')
            messageElement.textContent = 'No hay carritos disponibles. Cree un nuevo carrito para comenzar.'
            selectCart.parentNode.insertBefore(messageElement, selectCart.nextSibling)
        }
    }

    async function createNewCart() {
        try {
            const response = await fetch('/api/carts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            if (!response.ok) {
                throw new Error('Error al crear el nuevo carrito')
            }
            await loadCarts()
            alert('¡Nuevo carrito creado con éxito!')
        } catch (error) {
            console.error('Error:', error)
            alert('Se produjo un error al crear el nuevo carrito. Por favor, inténtalo de nuevo más tarde.')
        }
    }

    async function addToCart(event) {
        const button = event.target
        const productId = button.getAttribute('productId')
        const selectedCartId = selectCart.value

        if (selectedCartId === 'Seleccione un carrito') {
            alert('Por favor seleccione un carrito antes de agregar un producto.')
            return
        }

        const quantity = 1

        try {
            const response = await fetch(`/api/carts/${selectedCartId}/products/${productId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ quantity })
            })
            if (!response.ok) {
                throw new Error('Error al agregar el producto al carrito')
            }
            const data = await response.json()
            alert(data.message)
        } catch (error) {
            console.error('Error:', error)
            alert('Se produjo un error al agregar el producto al carrito.')
        }
    }

    function updateCartLink(cartId) {
        cartlink.href = `/carts/${cartId}`
    }
})
