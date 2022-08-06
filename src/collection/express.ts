import _ from 'lodash'
import isEmpty from 'lodash/isEmpty'
import toPlainObject from 'lodash/toPlainObject'
import find from 'lodash/find'

import { IPopulate } from 'joixsql'
import Knex from 'knex'
import Collection from './index'
import Model from '../model'

export type TObjectStringAny = { [char: string]: string | number | null | Date } 


/* CHECK UTIL METHODS */
const checks = (c: Collection) => {
    /* 
        This function check and return an error if one of the data
        is a column with a UNIQUE constraint in the DB and
        the data already exists. 
    */
    const uniqueConstraint = async (data: TObjectStringAny) => {
        //get all unique key from the models
        const uniqueKey = c.super().schemaSpecs().analyze().unique_keys
    
        const uniqueToFetch: any = {}
        //for each unique key present in the data to add/update
        uniqueKey.map((unique: string) => data[unique] !== undefined ? uniqueToFetch[unique] = data[unique] : null)

        //if unique key(s) are present in the data
        if (!isEmpty(uniqueToFetch)){
            //pull the data into a new collection  
            const r = await c.ctx().sql().pull().where(function(this: Knex.QueryBuilder){
                let r = this
                let i = 0;
                for (const key in uniqueToFetch){
                    if (i > 0)
                        r = r.or
                    r = r.where({[key]: uniqueToFetch[key]})
                    i++
                }
            }).run()

            //if we found at least one row existing with the parameter data 
            if (r.local().count() > 0){
                /* Getting the key and value */
                const m = r.local().nodeAt(0) as Model
                let kVal, val;
                for (const key in m.state){
                    if (uniqueToFetch[key]){
                        kVal = key
                        val = m.to().plainUnpopulated()[key]
                        break;
                    }
                }
                //and return an error.
                return {error: `Duplicate entry '${val}' for key '${kVal}'`}
            }
        }
        return null
    }

    /* 
        This function check and return an error if data key is a column with 
        a FOREIGN KEY constraint or a populatable (acey feature) and the data
        linked with them doesn't exist
    */
    const foreignConstraint = async (data: TObjectStringAny) => {
        //get all populatable + foreign fields
        const populates = c.super().schemaSpecs().getPopulate()

        const toFetch: any[][] = []
        //for each populatable/foreign present in the data to add/update
        populates.map((p: IPopulate) => data[p.key] !== undefined && toFetch.push([p.table_reference, p.key_reference, data[p.key], p.key]))
        
        //if populatable(s) are present in the data
        if (toFetch.length > 0){
            //select all the references value of the populatable found into an objects
            let ret: any = await c.sql().knex().select(function(this: Knex.QueryBuilder){
                let r = this
                let i = 0;
                for (const e of toFetch){
                    if (i > 0){
                        r = r.and
                    }
                    r = r.select(e[1]).from(e[0]).where(e[1], e[2]).first().as(`${e[0]}-${e[1]}`)
                    i++
                }
                return r
            })
            //convert RowDataPacket -> Object
            ret = toPlainObject(ret[0])

            let emptyKey: null | string[] = null
            //for each value found.
            for (let key in ret){
                //if one is equal to null, the data sent is not valid because the populatable reference value doesn't exist.
                if (ret[key] === null){
                    /* do some data-to-print formating */
                    const splited = key.split('-')
                    const originToFetchElem = find(toFetch, (o: any[]) => o[0] === splited[0] && o[1] === splited[1]) as any[]
                    emptyKey = [splited[0], splited[1], originToFetchElem[2], originToFetchElem[3]]
                    break
                }
            }
            /* emptyKey -> [originTableName, originColumnName, data-sent value, populatableColumnName ] */
            if (emptyKey)
                return {error: `'${emptyKey[2]}' doesn't refer to any element in '${emptyKey[0]}.${emptyKey[1]}'`}
        }
        return null
    }

    return { uniqueConstraint, foreignConstraint }
}


/* MIDDLEWARE UTIL METHODS */

const middleware = (c: Collection) => {
    const schemaValidator = (req: any, res: any, next: any) => { 
        const err = c.quick().test(req.body)
        if (!err)
            next()
        else {
            res.status(422).json({ error: err.toString() })
        }
    }
    return { schemaValidator }
}



/* REQUEST UTIL METHODS */
export type T_CALLBACK = (status: number, m: Model | null) => void
export interface IReqOptions {
    where?: TObjectStringAny | string
    filterGroup?: string
    callback?: T_CALLBACK
    noRender?: boolean
}

const request = (c: Collection) => {

    const postHandler = (keysAllowed: string[], options: IReqOptions | void) => {
        const filterGroup = options ? options.filterGroup : undefined
        const callback = options ? options.callback : undefined
        const noRender = options ? options.noRender : undefined

        return async (req: any, res: any) => { 
            const data: TObjectStringAny = {}
            keysAllowed.map((v: string) => {
                const val = req.body[v]
                if (val === null || val === NaN || val === undefined)
                    data[v] = null
                else 
                    data[v] = val
            })
        
            const errUnique = await checks(c).uniqueConstraint(data)
            if (errUnique){
                res.status(409).json(errUnique)
                callback && callback(409, null)
                return
            }
            const errForeign = await checks(c).foreignConstraint(data)
            if (errForeign){
                res.status(409).json(errForeign)
                callback && callback(409, null)
                return
            }

            try {
                const m = await c.quick().create(data)
                callback && callback(201, m)
                !noRender && res.status(201).json(m.to().filterGroup(filterGroup).plain())
            } catch (e: any){
                res.status(500).json(e.toString())
                callback && callback(500, null)
            }
        } 
    }

    const putHandler = (keysAllowed: string[], options: IReqOptions) => {
        const filterGroup = options ? options.filterGroup : undefined
        const callback = options ? options.callback : undefined
        const where = options ? options.where : undefined
        const noRender = options ? options.noRender : undefined
        if (!where){
            throw new Error("You need to set `where` option to identify the object to update. example: primary key value like: `where: 123` or `where: {email: 'joe@yahoo.com'}`")    
        }


        return async (req: any, res: any) => { 
            const data: any = {}
            keysAllowed.map((v: string) => {
                const val = req.body[v]
                if (val === null || val === NaN || val === undefined)
                    data[v] = null
                else 
                    data[v] = val
            })
    
            const errUnique = await checks(c).uniqueConstraint(data)
            if (errUnique){
                res.status(409).json(errUnique)
                callback && callback(409, null)
                return
            }
            const errForeign = await checks(c).foreignConstraint(data)
            if (errForeign){
                res.status(409).json(errForeign)
                callback && callback(409, null)
                return
            }

            try {
                const t = await c.quick().find(typeof where === 'string' ? req.params[where] : where)
                if (!t){
                    res.sendStatus(404)
                    callback && callback(404, null)
                } else {
                    await t.setState(data).saveToDB()
                    callback && callback(200, t)
                    !noRender && res.status(200).json(t.to().filterGroup(filterGroup).plain())
                }
            } catch (e: any){
                res.status(500).json(e.toString())
            }
        }
    }

    return { postHandler, putHandler }
}



export default (c: Collection) => {
    return {
        request: () => request(c),
        middleware: () => middleware(c) ,
        checks: () => checks(c)    
    }
}