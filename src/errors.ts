import Model from './model'

export default {
    onlyObjectOnModelState: () => new Error(`The state of a Model, can only be instanced and replaced with an object type.`),
    onlyArrayOnCollectionState: () => new Error(`The state of a Collection, can only be instanced and replaced with an array type.`),
    
    tableRequired: () => new Error(`You need to setup a table name when you instance a new Collection.`),
    tableAlreadyExist: (key: string) => new Error(`A collection with this table name has already been instanced. Key: ${key}.`),

    noPrimaryKey: (table: string) => new Error(`Your node model from collections ${table} must have a primary key to perform this action.`),
    noSchema: (m: Model) => new Error(`Model ${m.constructor.name} does NOT contain a schema.`),
    forbiddenArrayModel: (m: Model) => new Error(`${m.constructor.name}'s state contains an Array of Model. Please use a Collection instead.`),

    noCollectionBinding: (m: Model) => new Error(`You need to bind Model ${m.constructor.name} to a parent Collection to perform this action. -> You should set the the option 'kids' in the Model option at instanciation. Example: new Model({...someState}, parentCollection.option().kids())`)
}


