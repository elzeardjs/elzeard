import express from 'express'
import formData from 'express-form-data'
import morgan from 'morgan'
import { config } from 'elzeard'
import initRoutes from './src/routes'

const PORT = 3500

export const initServer = async () => {
    const server = express()
    server.use(express.json());
    server.use(formData.parse())
    server.use(morgan('tiny'))
  
    config.setHistoryDirPath('./history')
    config.setMySQLConfig({
      host: 'localhost',
      user: 'fanta',
      password: 'aqw12345',
      database: 'blog',
      timezone: 'utc'
    })
    await config.done()
    return server
}

initServer().then((server) => {
    initRoutes(server)
    server.listen(PORT)
})

