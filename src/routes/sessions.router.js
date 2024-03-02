import { Router } from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { registerUser, loginUser, logout } from '../controllers/sessionController.js'

const sessionsRouter = Router()

//Route register user 
sessionsRouter.post('/api/sessions/register', registerUser)

//Route login
sessionsRouter.post('/api/sessions/login', loginUser)

//Route logout
sessionsRouter.post('/api/sessions/logout', logout)


export default sessionsRouter