import { Router } from "express"
import { productModel } from "../models/product.model.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js"

const productsRouter = Router()

//Render on front with handlebars and IO
productsRouter.get("/productsSocket", isAuthenticated, async (req, res) => {
    try {
        const allProducts = await productModel.find({}, { _id: 0, __v: 0 }).lean() //We ensure flat javascript objects and not complex mongoose prototypes
        res.render("home", {
            style: "/css/styles.css",
            title: "All Products",
            allProducts,
        })
    } catch (error) {
        res.status(400).send("Internal server Error", error)
    }
})

//Render products in real time with ws
productsRouter.get("/realtimeproducts", isAuthenticated, async (req, res) => {
    res.render("realTimeProducts", {
        style: "/css/styles.css",
    })
})

//Render on front with handlebars and pagination-V2
productsRouter.get("/products", isAuthenticated, async (req, res) => {

    try {
        const page = parseInt(req.query.page) || 1
        const pageSize = parseInt(req.query.pagesize) || 10

        const allProducts = await productModel.paginate({}, { limit: pageSize, page })

        const simplifiedProducts = allProducts.docs.map(prod => {
            return {
                id: prod._id,
                title: prod.title,
                description: prod.description,
                price: prod.price,
                code: prod.code,
                stock: prod.stock,
                category: prod.category
            }
        })

        res.render('products', {
            style: '/css/styles.css',
            simplifiedProducts,
            hasPrevPage: allProducts.hasPrevPage,
            hasNextPage: allProducts.hasNextPage,
            prevPage: allProducts.prevPage,
            nextPage: allProducts.nextPage,
            page: allProducts.page,
            totalPages: allProducts.totalPages,
            user: req.session.user
        })

    } catch (error) {
        res.status(500).json({ response: 'Error', message: 'Internal server error', error })
    }
})

productsRouter.get("/api/products", async (req, res) => {
    const { limit, page, sort, category, available } = req.query

    let queries = {}

    try {
        if (page) {
            const pageNumber = parseInt(page);
            if (isNaN(pageNumber) || pageNumber <= 0) {
                return res.status(400).send({ response: "Error", message: "Invalid page number" });
            }
        }

        let options = {
            limit: parseInt(limit) || 10,
            page: parseInt(page) || 1
        }

        if (category) {
            queries.category = category
        }

        if (available === "true") {
            queries.stock = { $gt: 0 }
        } else if (available === "false") {
            queries.stock = 0
        }

        if (sort === "asc") {
            options.sort = { price: 1 }
        } else if (sort === "desc") {
            options.sort = { price: -1 }
        }

        const products = await productModel.paginate(queries, options)

        if (parseInt(page) > products.totalPages) {
            return res.status(400).send({ response: "Error", message: "Page does not exist" });
        }

        const baseUrl = req.protocol + '://' + req.get('host') + req.originalUrl
        const prevLink = products.hasPrevPage ? baseUrl.replace(`page=${products.page}`, `page=${products.prevPage}`) : null
        const nextLink = products.hasNextPage ? baseUrl.replace(`page=${products.page}`, `page=${products.nextPage}`) : null

        const response = {
            status: "Success",
            payload: products.docs,
            totalPages: products.totalPages,
            prevPage: products.prevPage,
            nextPage: products.nextPage,
            page: products.page,
            hasPrevPage: products.hasPrevPage,
            hasNextPage: products.hasNextPage,
            prevLink: prevLink,
            nextLink: nextLink
        }
        res.status(200).send({ response: "ok", message: response })
    } catch (error) {
        res.status(400).send({
            response: "Error read db",
            message: error,
        })
    }
})

//See With ID
productsRouter.get("/api/products/:id", async (req, res) => {
    const { id } = req.params
    try {
        const product = await productModel.findById(id)
        if (!product) {
            return res.status(404).send("Product not found")
        }
        res.status(200).send({ result: "Success", message: product })
    } catch (error) {
        res.status(404).send({ result: "Error", message: "Not found" })
    }
})

//Add new product
productsRouter.post("/api/products", async (req, res) => {
    const { title, description, price, thumbnail, code, stock, category } =
        req.body

    try {
        let prod = await productModel.create({
            title,
            description,
            price,
            thumbnail,
            code,
            stock,
            category,
        })
        res.status(200).send({ result: "Success", message: prod })
    } catch (error) {
        res.status(400).send({
            result: "Error create product",
            message: error.message,
        })
    }
})

//Update product
productsRouter.put("/api/products/:id", async (req, res) => {
    const { id } = req.params
    const {
        title,
        description,
        price,
        thumbnail,
        code,
        stock,
        status,
        category,
    } = req.body

    try {
        const product = await productModel.findByIdAndUpdate(id, {
            title,
            description,
            price,
            thumbnail,
            code,
            stock,
            status,
            category,
        })

        if (!product) {
            return res
                .status(404)
                .send({ result: "Error", message: "Product not found" })
        }
        res.status(200).send({ result: "OK", message: "Product updated" })
    } catch (error) {
        res.status(400).send({ result: "Error updating product", message: error })
    }
})

//Delete Product
productsRouter.delete("/api/products/:id", async (req, res) => {
    const { id } = req.params
    try {
        const product = await productModel.findByIdAndDelete(id)
        if (!product) {
            return res
                .status(404)
                .send({ result: "Error", message: "Product not found" })
        }
        res
            .status(200)
            .send({ result: "Success", message: "Product deleted", product })
    } catch (error) {
        res.status(400).send({ result: "Error deleting product", message: error })
    }
})

export default productsRouter
