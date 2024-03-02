import { Router } from "express"

const usersRouter = Router()

usersRouter.get('/', (req, res) => {
    try {
        res.render("login", {
            style: "/css/styles.css",
            title: "Login user",
        })
    } catch (error) {
        res.status(400).send("Internal server error", error)
    }
})

usersRouter.get('/register', (req, res) => {
    try {
        res.render("register", {
            style: "/css/styles.css",
            title: "Register user"
        })
    } catch (error) {
        res.status(400).send("Internal server error", error)
    }
})

usersRouter.get('/registered', (req, res) => {
    try {
        res.render("registered", {
            style: "/css/styles.css",
            title: 'User registered'
        })
    } catch (error) {
        res.status(400).send("Internal server error", error)
    }
})



export default usersRouter