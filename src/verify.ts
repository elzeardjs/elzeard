import Collection from './collection'
import Model from './model'
import Errors from './errors'
import Manager from './manager'
import _ from 'lodash'
import { IForeign } from 'joi-to-sql'
import manager from './manager'


export const verifyCrossedPopulateValues = (v: Model) => {
    const origin_table = v.sql().table().name()

    const recur = (v: Model) => {
        const populate = v.schema().getPopulate()
        for (let p of populate){
            const { table_reference: table } = p
            if (table === origin_table){
                throw new Error(`Crossed populate found in node model of the collection: ${origin_table}. You can use the method noPopulate() on your shema to disable auto-population mode on foreign keys pointed on primary keys.`)
            }
            const c = Manager.collections().node(table) as Collection
            recur(c.newNode(undefined))
        }
    }
    recur(v)
}

export const verifyPopulateExistences = (c: Collection) => {
    const origin_table = c.sql().table().name()
    const populate = c.schema().getPopulate()

    for (let p of populate){
        const { table_reference: table, key_reference, key } = p
        const cRef = Manager.collections().node(table)
        if (!cRef)
            throw new Error(`${origin_table}[${key}] is populated with the key: '${key_reference}' from the TABLE: '${table}'. This TABLE does NOT exist.`)
        const allKeys = cRef.schema().getAllKeys()
        if (allKeys.indexOf(key_reference) == -1){
            throw new Error(`${origin_table}[${key}] is populated with the KEY: '${key_reference}' from the TABLE: '${table}'. This KEY does NOT exist.`)
        }
    }
}

export const verifyForeignKeyExistences = (c: Collection) => {
    const origin_table = c.sql().table().name()
    const foreigns = c.schema().getForeignKeys()

    for (let f of foreigns){
        const { table_reference: table, key_reference, key } = f
        const cRef = Manager.collections().node(table)
        if (!cRef)
            throw new Error(`${origin_table}[${key}] is a defined foreign key pointing towards the key: '${key_reference}' in the TABLE: '${table}'. This TABLE does NOT exist.`)
        const allKeys = cRef.schema().getAllKeys()
        if (allKeys.indexOf(key_reference) == -1){
            throw new Error(`${origin_table}[${key}] is a defined foreign key pointing towards the KEY: '${key_reference}' in the table: '${table}'. This KEY does NOT exist.`)
        }
    }
}

export const verifyGroupingValuesExistence = (c: Collection) => {
    const origin_table = c.sql().table().name()
    const populate = c.schema().getPopulate()
    for (let p of populate){
        const { table_reference, group_id, key_reference, key } = p
        if (group_id){
            const cRef= Manager.collections().node(table_reference) as Collection
            const mRef = cRef.newNode(undefined)
            const groups = mRef.schema().getGroups()
            if (!groups[group_id])
                throw new Error(`A GROUP_ID: '${group_id}' from the table: '${cRef.sql().table().name()}' is referenced in ${origin_table}[${key}]. This GROUP_ID does NOT exist.`)
        }
    }
}

export const verifyCrossedForeignKey = (c: Collection) => {

    const recur = (elem: IForeign, history: string[], over: string[], tableName: string) => {
        const { table_reference, key_reference} = elem
        const hash = table_reference+key_reference

        if (history.indexOf(hash) != -1){
            throw new Error(`You created 2 crossed foreign keys with cascade action table: ${table_reference}, key: ${key_reference} `)
        } else if (history.indexOf(hash) == -1){
            history.push(hash)
        }
        if (over.indexOf(hash+tableName) != -1)
            return
        else 
            over.push(hash + tableName)

        const cRef = manager.collections().node(table_reference)
        for (const f of cRef.schema().getForeignKeys()){
            recur(f, history, over, cRef.option().table())
        }
    }

    for (const f of c.schema().getForeignKeys()){
        const history: string[] = []
        const over: string[] = []
        recur(f, history, over, c.option().table())
    }

}

export const verifyIfContainArrayOfModel = (v: Model) => {

    let doesContain = false
    const recur = (v: any) => {

        if (doesContain)
            return

        if (!v || v instanceof Date)
            return

        if (v instanceof Model){
            for (let key in v.state)
                recur(v.state[key])
            return
        }

        if (Array.isArray(v)){
            for (let e of v){
                if (e instanceof Model){
                    doesContain = true
                    return
                }
                recur(e)
            }
            return
        }

        if (typeof v === 'object'){
            for (let key in v)
                recur(v[key])
        }
    }

    recur(v)
    return doesContain
}

export const verifyAllModel = (m: Model) => {
    if (verifyIfContainArrayOfModel(m))
        throw Errors.forbiddenArrayModel(m)
}