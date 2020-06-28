import Model from './model'

export default {
    onlyObjectOnModelState: () => new Error(`The state of a Model, can only be instanced and replaced with an object type.`),
    onlyArrayOnCollectionState: () => new Error(`The state of a Collection, can only be instanced and replaced with an array type.`),
    
    uniqKeyRequired: () => new Error(`You need to manually setup a unique key for every connected Model and Collection you instance.`),
    keyAlreadyExist: (key: string) => new Error(`You have 2 connected Models/Collections using the same key: ${key}.`),

    forbiddenArrayModel: (m: Model) => new Error(`${m.constructor.name}'s state contains an Array of Model. Please use a Collection instead.`),
    forbiddenNestedConnexion: (m: Model) => new Error(`${m.constructor.name} contains a connected Model. Connected Models can't be nested`),
    forbiddenMultiDimCollection: () => new Error(`You can't build a Collection with a Collection as a node element`),
    forbiddenModelCollection: () => new Error("You can't build a Collection with a Model as a collection element"),


    configNotDone: () => new Error(`You need to specify the config has done at the root of your project: "config.done()" to run Acey.`)
}


