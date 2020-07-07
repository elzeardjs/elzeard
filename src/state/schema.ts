import Model from '../model'
import Collection from '../collection'
import Manager from '../manager'
import { Engine } from 'joi-to-sql'
import config from '../config'
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

    const getPopulate = () => {
        const { foreign_keys, populate } = engine().analyze()
        let pops = populate.slice()
        _.remove(pops, {no_populate: true})
        for (let foreign of foreign_keys){
            const { key, table_reference, key_reference, group_id, no_populate } = foreign
            if (!no_populate){
                const collectionRef = Manager.collections().node(table_reference) as Collection
                if (collectionRef.schema().getPrimaryKey() === key_reference){
                    !_.find(populate, {key}) && populate.push({
                        key, 
                        table_reference, 
                        key_reference, 
                        group_id, 
                        no_populate
                    })
                }
            }
        }
        return populate
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
        getPopulate,
        analyze: () => engine().analyze(),
        getAllKeys: () => engine().analyze().all_keys,
        getGroups: () => engine().analyze().groups,
        getPrimaryKey: () => engine().analyze().primary_key as string,
        getForeignKeys: () => engine().analyze()?.foreign_keys,
        getRefs: () => engine().analyze()?.refs,
        defaults: () => engine().analyze()?.defaults
    }
}