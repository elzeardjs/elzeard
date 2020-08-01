import Model from './model'
import SQLManager from './sql'
import _ from 'lodash'
import knex from 'knex'

export const insertOrUpdate = async (tableName: string, p: Array<Object> | Object) => {

    const rows = !_.isArray(p) ? [p] : p

    return await SQLManager.mysql().transaction((trx: knex.Transaction) => {

        const queries = rows.map((tuple) => {

            const insert = trx(tableName).insert(tuple).toString()
            const update = trx(tableName).update(tuple).toString().replace(/^update(.*?)set\s/gi, '')

            return trx.raw(`${insert} ON DUPLICATE KEY UPDATE ${update}`).transacting(trx)
        })

        return Promise.all(queries).then(trx.commit).catch(trx.rollback)
    })
}

export const areValidWhereArguments = (...args: any) => {
    if (args.length == 0)
        return false
    if (args.length == 1)
        return typeof args[0] === 'function' || Model._isObject(args[0])
    if (args.length == 2)
        return typeof args[0] === 'string'
    if (args.length == 3){
        return typeof args[0] === 'string' && typeof args[1] === 'string'
    }
    return false
}