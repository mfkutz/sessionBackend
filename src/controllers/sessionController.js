import { usersModel } from "../models/users.models.js"

async function registerUser(req, res) {
    const { first_name, last_name, email, age, password } = req.body

    try {
        const existingUser = await usersModel.findOne({ email })

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" })
        }

        const newUser = new usersModel({
            first_name,
            last_name,
            email,
            age,
            password
        })

        await newUser.save()
        res.status(201).send('Registered user')

    } catch (error) {
        console.error('Error registering user:', error)
        res.status(500).json({ message: "Error registering user" })
    }
}

async function loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    try {
        const user = await usersModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (password !== user.password) {
            return res.status(401).json({ message: "Incorrect password." });
        }

        const sessionInfo = email === "adminCoder@coder.com" && password === "adminCod3r123"
            ? { email, first_name: user.first_name, last_name: user.last_name, isAdmin: true }
            : { email, first_name: user.first_name, last_name: user.last_name, isAdmin: false }

        req.session.user = sessionInfo

        res.status(200).json({ message: "Successful login.", user })

    } catch (error) {
        console.error("failed to login:", error);
        res.status(500).json({ message: "failed to login." });
    }
}

async function logout(req, res) {
    req.session.destroy(err => {
        if (!err) res.send('logout ok')
        else res.send({ status: 'Logout ERROR', body: err })
    })
}

export { registerUser, loginUser, logout }