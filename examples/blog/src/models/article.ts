import { Joi, Collection, Model  } from 'elzeard'

export class ArticleModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        title: Joi.string().min(0).max(140).default(''),
        content: Joi.string().min(20).max(5000).required(),
        created_at: Joi.date().default(() => new Date()),
    })

    constructor(initialState: any, options: any){
        super(initialState, ArticleModel, options)
    }

    content = () => this.state.content
    title = () => this.state.title
    ID = () => this.state.id
    createdAt = () => this.state.created_at
}

export class ArticleCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ArticleModel, ArticleCollection], options)
    }

    pullSortedByDate = async () => await this.quick().pull().orderBy('created_at', 'desc').limit(5).run() as ArticleCollection
}

export default new ArticleCollection([], {table: 'articles'})