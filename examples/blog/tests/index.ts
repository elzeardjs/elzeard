import { expect } from 'chai';
import 'mocha';
import axios from 'axios'

const URL = 'http://localhost:3500'

const main = () => {

    it('Remove all from article table', async () => {
        const res = await axios(`${URL}/article/all`, {
            method: 'DELETE'
        })
        expect(res.status).to.eq(200)
        const res2 = await axios(`${URL}/article/all`)
        expect(res2.status).to.eq(200)
        expect(res2.data.length).to.eq(0)
    })

    it('Create blog post', async () => {
        const content =  'This is my first article and im going to make it special'
        const title = '1st !'

        const res = await axios(`${URL}/article`, {
            method: 'POST',
            data: { content, title }
        })
        expect(res.status).to.eq(201)
        const res2 = await axios(`${URL}/article/all`)
        expect(res2.status).to.eq(200)
        expect(res2.data.length).to.eq(1)
        const article = res2.data[0]
        expect(content).to.eq(article.content)
        expect(title).to.eq(article.title)
    })

    it('Update blog post', async () => {
        const content =  'This is my first article and im going to make it special'
        const title = 'I want to update the title'

        const res = await axios(`${URL}/article/1`, {
            method: 'PUT',
            data: { content, title }
        })
        expect(res.status).to.eq(200)
        const res2 = await axios(`${URL}/article/all`)
        expect(res2.status).to.eq(200)
        expect(res2.data.length).to.eq(1)
        const article = res2.data[0]
        expect(content).to.eq(article.content)
        expect(title).to.eq(article.title)
    })

    it('Delete blog post', async () => {
        const res = await axios(`${URL}/article/1`, {
            method: 'DELETE',
        })
        expect(res.status).to.eq(200)
        const res2 = await axios(`${URL}/article/all`)
        expect(res2.status).to.eq(200)
        expect(res2.data.length).to.eq(0)
    })
}

main()