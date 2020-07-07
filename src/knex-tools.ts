import SQLManager from './sql'
import _ from 'lodash'
import { IForeign } from 'joi-to-sql'
import Manager from './manager'
import Knex from 'joi-to-sql/node_modules/knex'

export const insertOrUpdate = async (tableName: string, p: Array<Object> | Object) => {

    const rows = !_.isArray(p) ? [p] : p

    return await SQLManager.mysql().transaction((trx: Knex.Transaction) => {

        const queries = rows.map((tuple) => {

            const insert = trx(tableName).insert(tuple).toString()
            const update = trx(tableName).update(tuple).toString().replace(/^update(.*?)set\s/gi, '')

            return trx.raw(`${insert} ON DUPLICATE KEY UPDATE ${update}`).transacting(trx)
        })

        return Promise.all(queries).then(trx.commit).catch(trx.rollback)
    })
}

export const createTables = async () => {

    return await SQLManager.mysql().transaction(async (trx: Knex.Transaction) => {

        const queries = sortTableToCreate().map(async (tName: string) => {
            const isCreated = await SQLManager.isTableCreated(tName)
            if (!isCreated){
                return Manager.collections().node(tName).schema().engine().table(tName)
            }
        })

        return Promise.all(queries).then(trx.commit).catch(trx.rollback)
    })
}

export const dropAllTables = async () => {
    try {
        await SQLManager.mysql().raw(`SET FOREIGN_KEY_CHECKS=0;`)
        const res = await SQLManager.mysql().transaction(async (trx: Knex.Transaction) => {

            const queries = sortTableToCreate().reverse().map(async (tName: string) => {
                const isCreated = await SQLManager.isTableCreated(tName)
                if (isCreated)
                    return Manager.collections().node(tName).sql().table().drop()
            }) as Knex.Raw<any>[]

            return Promise.all(queries).then(trx.commit).catch(trx.rollback)
        })
        return res
    } catch (e){
        if (e.errno === 1217){
            void(e)
        } else {
            console.log(e)
        }
    } finally {
        await SQLManager.mysql().raw(`SET FOREIGN_KEY_CHECKS=1;`)
    }
}

export const sortTableToCreate = () => {
    const collections = Manager.collections()
    let tablesToCreate = []
    let tablesWithFK = []

    const toArrayTableRef = (list: IForeign[]): string[] => list.map((e) => e.required ? e.table_reference : '').filter((e) => e != '')

    for (let key in collections.get()){
        const c = collections.node(key)
        const tName = c.sql().table().name()
        const foreignKeys = c.schema().getForeignKeys()
        if (foreignKeys.length == 0 || _.every(foreignKeys, {required: false})) 
            tablesToCreate.push(tName)
        else 
            tablesWithFK.push(tName)
    }

    let i = 0;
    while (i < tablesWithFK.length){
        const c = collections.node(tablesWithFK[i])
        const listKeys = toArrayTableRef(c.schema().getForeignKeys())
        let count = 0
        for (const key of listKeys)
            tablesToCreate.indexOf(key) != -1 && count++
        
        if (count === listKeys.length){
            tablesToCreate.push(tablesWithFK[i])
            tablesWithFK.splice(i, 1)
            i = 0;
        } else {
            i++
        }
    }

    if (tablesWithFK.length > 0)
        throw new Error(`Table${tablesWithFK.length > 1 ? 's' : ''}: ${tablesWithFK.join(', ')} not created because of crossed foreign keys`)
    
    return tablesToCreate
}