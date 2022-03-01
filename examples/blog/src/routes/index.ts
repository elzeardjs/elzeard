import express from 'express'
import articleRoutes from './article'

export default (server: express.Express) => {
    articleRoutes(server)
}