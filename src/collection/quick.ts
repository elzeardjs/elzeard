import Model from '../model'
import Collection from './'
import errors from '../errors'
import { areValidWhereArguments } from '../knex-tools'
import { ICut } from '../sql/pull-methods'

type TPrimary = string | number

const isPrimary = (v: any) => typeof v === 'number' || typeof v === 'string'

export interface IQuick {
    create(d: Object): Promise<Model>
    remove(...primaryOrPredicate: any): Promise<Number>
    count(...v: any): Promise<Number>
    update(data: Object, ...predicate: any): Promise<Number>
    find(...primaryOrPredicate: any): Promise<Model | null>
    pull(...v: any): ICut
    test(v: any): Error | void
}

//To execute minimalistic sql queries
export default (c: Collection): IQuick => {
    const sql = c.sql()

    const _checkPrimary = (v: any) => {
        const primary = c.super().schemaSpecs().getPrimaryKey()
        if (isPrimary(v) && !primary)
            throw errors.noPrimaryKey(c.super().option().table())
        return isPrimary(v)
    }

    const create = async (d: Object): Promise<Model> => {
        const m = c.newNode(d).mustValidateSchema()
        await sql.node(m).insert()
        return await m.populate()
    }

    const remove = async (...primaryOrPredicate: any) => {
        const isOneArg = primaryOrPredicate.length == 1
        if (primaryOrPredicate.length === 0)
            throw new Error("Must contain a primary key or a predicate as a parameter")

        if (isOneArg && _checkPrimary(primaryOrPredicate[0]))
            return await sql.remove().byPrimary(primaryOrPredicate[0] as TPrimary)
        
        if (!areValidWhereArguments(...primaryOrPredicate))
            throw new Error("arguments are not valid.")   

        return sql.remove().where(...primaryOrPredicate)
    }

    const count = async (...v: any): Promise<number> => {
        if (v.length === 0)
            return await sql.count().all()
    
        if (!areValidWhereArguments(...v))
            throw new Error("arguments are not valid.") 

        return await sql.count().where(...v)
    }

    const update = async (data: Object, ...predicate: any) => {
        if (predicate.length === 0)
            return await sql.update(data).all()

        if (!areValidWhereArguments(...predicate))
            throw new Error("arguments are not valid.") 
        
        return await sql.update(data).where(...predicate)
    }

    const find = async (...primaryOrPredicate: any) => {
        const isOneArg = primaryOrPredicate.length == 1
        if (primaryOrPredicate.length === 0)
            throw new Error("Must contain a primary key or a predicate as a parameter")

        if (isOneArg && _checkPrimary(primaryOrPredicate[0]))
            return await sql.find().byPrimary(primaryOrPredicate[0] as TPrimary)

        if (!areValidWhereArguments(...primaryOrPredicate))
            throw new Error("arguments are not valid.")    

        return sql.find().where(...primaryOrPredicate)
    }

    const pull = (...v: any) => {
        if (v.length === 0)
            return c.ctx().sql().pull().all()

        if (!areValidWhereArguments(...v))
            throw new Error("arguments are not valid.")  
        
        return c.ctx().sql().pull().where(...v)
    }

    //Check if the data passes the schema validator to be added in the table 
    const test = (v: any) => {
        try {
            c.newNode(undefined).mustValidateSchema(v)
        } catch (e){
            return e
        }
    }

    return {
        create,
        remove,
        count,
        update,
        find,
        pull,
        test
    }
}