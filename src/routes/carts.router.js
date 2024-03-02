import { Router } from 'express'
import { cartModel } from '../models/cart.model.js'
import { productModel } from '../models/product.model.js'
import { isAuthenticated } from '../middlewares/authMiddleware.js'

const cartsRouter = Router()

//Create new cart
cartsRouter.post('/api/carts', async (req, res) => {
    try {
        const cart = await cartModel.create({ products: [] })
        res.status(200).send({ result: 'Success', message: cart })
    } catch (error) {
        res.status(400).send({ result: 'Error', message: error })
    }
})

//Show all carts
cartsRouter.get('/api/carts', async (req, res) => {
    try {
        const carts = await cartModel.find().lean()
        res.status(200).json({ response: 'Success', carts })
    } catch (error) {
        res.status(400).json({ response: 'Error', message: error.message })
    }
})

cartsRouter.get('/api/carts/:cid', async (req, res) => {
    const { cid } = req.params
    try {
        const cart = await cartModel.findById(cid).populate('products.product')
        if (!cart) {
            return res.status(404).send({ result: 'Error', message: 'Cart not found' })
        }
        res.status(200).send({ result: 'Success', message: cart })
    } catch (error) {
        res.status(400).send({ result: 'Error consulting cart', error })
    }
})

//Carts view
cartsRouter.get('/carts/:cid', isAuthenticated, async (req, res) => {
    const { cid } = req.params

    try {
        const cart = await cartModel.findById(cid).populate('products.product').lean()
        if (!cart) return res.status(404).json({ response: 'Error', message: 'Cart not found' })

        const stringifiedCart = JSON.stringify(cart, null, '\t')

        res.render('carts', {
            style: '/css/styles.css',
            cart
        })

    } catch (error) {
        res.status(400).send({ response: 'Error', message: 'Error consulting cart', error })
    }
})

//Add product in especific cart
cartsRouter.post('/api/carts/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params
    const { quantity } = req.body
    try {
        const cart = await cartModel.findById(cid)
        if (!cart) {
            return res.status(404).json({ result: 'Error', message: 'Cart not found' })
        }

        const product = await productModel.findById(pid)
        if (!product) {
            return res.status(404).json({ result: 'Error', message: 'Product not found' })
        }

        const existingProductIndex = cart.products.findIndex(prod => prod.product.toString() === pid)
        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity += quantity
        } else {
            cart.products.push({ product: pid, quantity })
        }
        await cart.save()
        res.status(200).json({ result: 'Success', message: 'Product added to cart' })
    } catch (error) {
        res.status(400).json({ result: 'Error', message: error.message })
    }
})

//Delete one product from cart
cartsRouter.delete('/api/carts/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params

    try {

        const cart = await cartModel.findById(cid)
        if (!cart) {
            return res.status(404).json({ result: 'Error', message: 'Cart not found' })
        }

        const product = await productModel.findById(pid)
        if (!product) {
            return res.status(404).json({ result: 'Error', message: 'Product not found' })
        }

        const existingProductIndex = cart.products.findIndex(prod => prod.product.toString() === pid)

        if (existingProductIndex !== -1) {
            cart.products.splice(existingProductIndex, 1)
        } else {
            res.status(404).send({ result: 'Error', message: 'Product not found in cart' })
        }
        await cart.save()
        res.status(200).json({ result: 'Success', message: 'Product deleted from cart' })

    } catch (error) {
        res.status(400).json({ result: 'Error', message: error.message })
    }
})

//Update the cart with an array of products
cartsRouter.put('/api/carts/:cid', async (req, res) => {
    const { cid } = req.params
    const products = req.body.products

    try {
        const cart = await cartModel.findById(cid)
        if (!cart) return res.status(404).json({ response: 'Error', message: 'Cart not found' })
        if (!Array.isArray(products)) return res.status(400).json({ response: 'Error', message: 'Product must be an array' })

        for (const item of products) {
            const productId = item.product
            const quantity = item.quantity

            // Search the product in the database
            const product = await productModel.findById(productId)
            if (!product) {
                return res.status(404).json({ response: 'Error', message: `Product with id ${productId} not found` })
            }

            // Update cart with product and quantity
            const existingProductIndex = cart.products.findIndex(prod => prod.product.toString() === productId)

            if (existingProductIndex !== -1) {
                // If the product already exists in the cart, update the quantity
                cart.products[existingProductIndex].quantity = quantity
            } else {
                // If the product does not exist in the cart, add it
                cart.products.push({ product: productId, quantity: quantity })
            }
        }

        await cart.save()

        return res.status(200).json({ response: 'Success', message: 'Cart updated successfully' })
    } catch (error) {
        return res.status(500).json({ response: 'Error', message: 'Internal server error', error })
    }
})

//Update quantity product from cart
cartsRouter.put('/api/carts/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params
    const { quantity } = req.body
    try {

        const cart = await cartModel.findById(cid)
        if (!cart) return res.status(404).json({ response: 'Error', message: 'Cart not found' })

        const product = await productModel.findById(pid)
        if (!product) return res.status(404).json({ response: 'Error', message: 'Product not found' })

        //Stock control
        if (quantity > product.stock) return res.status(404).json({ response: 'Error', message: 'Out of stock', in_stock: product.stock })

        if (quantity < 1) return res.status(404).json({ response: 'Error', message: 'Quantity cannot be less than 1' })

        const existingProductIndex = cart.products.findIndex(prod => prod.product.toString() === pid)
        if (existingProductIndex !== -1) {
            cart.products[existingProductIndex].quantity = quantity
        } else {
            res.status(404).json({ response: 'Error', message: 'Product not found in cart' })
        }
        await cart.save()
        res.status(200).json({ message: "Updated quantity" })

    } catch (error) {
        res.status(400).json({ result: 'Error', message: error.message })
    }
})

//Delete all product from cart (empty cart)
cartsRouter.delete('/api/carts/:cid', async (req, res) => {
    const { cid } = req.params
    try {
        const cart = await cartModel.findById(cid)
        if (!cart) return res.status(404).json({ response: 'Error', message: 'Cart not found' })
        cart.products = []
        await cart.save()
        res.status(200).json({ response: 'Done', message: 'All products removed from cart' })
    } catch (error) {
        res.status(500).json({ response: 'Error', message: 'Internal server error', error })
    }
})

export default cartsRouter