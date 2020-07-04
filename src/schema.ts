import Model from './model'
import { Engine } from 'joi-to-sql'
import config from './config'
import _ from 'lodash'

export default (m: Model) => {
    const schema = (m.option().nodeModel() as any).schema

    const engine = (): Engine => new Engine(schema, { mysqlConfig: config.mysqlConfig() })

    const validate = (value: any) => {
        const ret = schema.validate(value)
        return {
            error: ret.error ? ret.error.details[0].message : undefined,
            value: ret.value
        }
    }

    const cleanNonPresentValues = (state: any) => {
        const newState = _.cloneDeep(state)
        const describedSchema = schema.describe().keys
        for (const key in state)
            !(key in describedSchema) && delete newState[key]
        return newState
    }

    return {
        cleanNonPresentValues,
        validate,
        engine,
        schemaAnalyzed: () => engine().analyze(),
        getPrimaryKey: () => engine().analyze().primary_key as string,
        getForeignKeys: () => engine().analyze()?.foreign_keys,
        getRefs: () => engine().analyze()?.foreign_keys,
        defaults: () => engine().analyze()?.defaults
    }
}