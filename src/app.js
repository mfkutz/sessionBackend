import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import cookieParser from 'cookie-parser'
import __dirname from './utils.js'
import handlebars from 'express-handlebars'
import { Server } from 'socket.io'
import usersRouter from './routes/users.router.js'
import sessionsRouter from './routes/sessions.router.js'
import productsRouter from './routes/products.router.js'
import cartsRouter from './routes/carts.router.js'
import { productModel } from './models/product.model.js'
import mongoose from 'mongoose'

const port = 8080
const app = express()
const httpServer = app.listen(port, () =>
	console.log(`'Server online - PORT ${port}`),
)

//Connection DB
mongoose
	.connect(
		'mongodb+srv://markutz:xYR20w6UyuRGtumz@cluster0.8r0sqah.mongodb.net/ecommerce?retryWrites=true&w=majority',
	)
	.then(() => {
		console.log('Connected to the database')
	})
	.catch(() => {
		console.log('Error connecting to database')
	})

//Middleware session
app.use(cookieParser("sÑcret925501135"))
app.use(session({
	store: MongoStore.create({
		mongoUrl: 'mongodb+srv://markutz:xYR20w6UyuRGtumz@cluster0.8r0sqah.mongodb.net/ecommerce?retryWrites=true&w=majority',
		ttl: 600 //unit in seconds
	}),
	secret: "sÑcret314159",
	resave: false,
	saveUninitialized: false
}))

//Socket server
const io = new Server(httpServer)

//Middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//Templates
app.engine('handlebars', handlebars.engine())
app.set('views', __dirname + '/views')
app.set('view engine', 'handlebars')
app.use(express.static(__dirname + '/public'))

//Routes
app.use('/', sessionsRouter)
app.use('/', productsRouter)
app.use('/', cartsRouter)
app.use('/', usersRouter)

//Connection WS
io.on('connection', (socket) => {
	console.log('User Connected')

	sendUpdatedProducts(socket)

	async function sendUpdatedProducts(socket) {
		try {
			const updatedProducts = await productModel.find().lean()
			socket.emit('updateProducts', updatedProducts)
		} catch (error) {
			console.error('Internal server error', error)
			socket.emit('updateProducts', [])
		}
	}

	//Logic for save
	socket.on('addProduct', async (newProductData) => {
		try {
			const result = await productModel.create(newProductData)
			socket.emit('productAddedState', 'Product Added')
			sendUpdatedProducts(io)
		} catch (error) {
			if (error.code === 11000) {
				socket.emit(
					'productAddedState',
					'Error: Duplicate key, product code already exists',
				)
			} else {
				console.error('Internal server error', error)
				socket.emit("productAddedState', 'Internal server error")
			}
		}
	})

	//Delete product
	socket.on('deleteProduct', async (id) => {
		try {
			let productState = await productModel.findByIdAndDelete(id)
			if (productState !== null) {
				socket.emit('deleteProduct', 'Product deleted')
				sendUpdatedProducts(io)
			} else {
				socket.emit('deleteProduct', 'Not found')
			}
		} catch (error) {
			//Verify CastError
			if (error instanceof mongoose.CastError) {
				socket.emit('deleteProduct', 'Error: ID Product not valid')
			} else {
				console.error('Internal server error', error)
				socket.emit('deleteProduct', 'Internal server error')
			}
		}
	})
})
