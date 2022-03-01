import express from 'express'
import articles from '../models/article' 

export default (server: express.Express) => {

    const { schemaValidator } = articles.expressTools().middleware()
    const { postHandler, putHandler } = articles.expressTools().request()

    server.post('/article', 
        schemaValidator, 
        postHandler(['content', 'title'])
    )

    server.put('/article/:id', 
        schemaValidator, 
        /*
            The second parameter is the key name of the route parameter and 
            the column to find in the database. It has to be the same.
            Or through an object ex: {id: 5}
        */
        putHandler(['content', 'title'], 'id')
    )

    server.get('/article/all', async (req, res) => {
        const collection = await articles.quick().pull().run()
        res.json(
            collection.local().
            orderBy(['created_at'], ['desc']).
            local().
            to().
            plain()
        )
    })

    server.delete('/article/all', async (req, res) => {
        try {
            articles.sql().remove().all()
            res.sendStatus(200)
        } catch (e){
            res.status(500)
            res.json(e.toString())
        }
    })

    server.delete('/article/:id', async (req, res) => {
        await articles.quick().remove(req.params.id)
        res.sendStatus(200)
    })
}

