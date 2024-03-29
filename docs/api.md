
# API 📐  

<br />

<br />


<p align="center">
  <a href="#model">
    <img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f4541417a736e5134574a633459673570626a2d5a2d44703763376176364e565f6a71616b4770586f517244683241.png?raw=true"/>
  </a>

  <img width="5%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>
  
  <a href="#collection">
    <img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f4541424341362d594d694e4e53675a51722d534746773850546c526352557931756d78536c78356c314e4a427877.png?raw=true"/>
  </a>

  <img width="5%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>

  <a href="#interfaces">
    <img width="20%" src="https://github.com/Fantasim/assets/blob/master/68747470733a2f2f736961736b792e6e65742f45414375775a754a5166476d5a3071617033714175484d646e5f545650724e6a62496c5870527568367670335341.png?raw=true"/>
  </a>
</p>

<br />

<br />

<br />


## Model

<p align="center" font-style="italic" >
  <a>
    <img src="https://github.com/Fantasim/assets/blob/master/model.png?raw=true" width="100%">
  </a>
</p>

A Model is built with an **object**.

#### Example - Article Model:
```ts
import { Model } from 'elzeard'

class ArticleModel extends Model {

    static schema = Joi.object({
        id: Joi.number().autoIncrement().primaryKey(),
        title: Joi.string().min(0).max(140).default(''),
        content: Joi.string().min(20).max(5000).required(),
        created_at: Joi.date().default(() => new Date()),
    })

    constructor(initialState: any, options: any){
        super(initialState, ArticleModel, options)
    }

    ID = (): number => this.state.id
    title = (): string => this.state.title
    content = (): string => this.state.content
    createdAt = (): Date => this.state.created_at
}
```

<br />

### Instanciation : `super(initialState: Object, options: IOption)`

<br />

- **Model's values**:

    | Name | Type | Description |
    | -- | -- | -- |
    | [**state**](https://github.com/arysociety/acey/blob/master/docs/examples.md#state) |`Object` | return the current **Model's state** |

<br />

- **Model's methods**: 

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | [**deleteKey**](https://github.com/arysociety/acey/blob/master/docs/examples.md#deletekey) (key: string or string[]) | `IAction` | remove **key(s)** in the Model's state object |
    | async [**destroy**](https://github.com/arysociety/acey/blob/master/docs/examples.md#deletekey)() | `void` | Remove the Model's state from its table |
    | [**is**](https://github.com/arysociety/acey/blob/master/docs/examples.md#is)() |`IsManager` | return **methods giving informations** about the **Model's composition**. |
    | [**saveToDB**](https://github.com/arysociety/acey/blob/master/docs/examples.md#save)() |`void` | **Save** the Model's state into the database. (update or insert) |
    | [**copy**](https://github.com/arysociety/acey/blob/master/docs/examples.md#setstate)() |`Model` | Returns an identical copy of the current model |
    | async [**populate**](https://github.com/arysociety/acey/blob/master/docs/examples.md#setstate)() |`void` | Replaces the key defined as a foreign key or a populated with the object at the origin of the foreign key or populate key. |
    | [**unpopulate**](https://github.com/arysociety/acey/blob/master/docs/examples.md#setstate)() |`void` | Reverse effect of **populate()** |
    | [**new**](https://github.com/arysociety/acey/blob/master/docs/examples.md#setstate)(defaultState: Object) |`Model` | Create a new Model based on the current one with the state passed in parameters |
    | [**setState**](https://github.com/arysociety/acey/blob/master/docs/examples.md#setstate)(state: Object) |`IAction` | **update the state** by merging it with the `Object` parameter. |
    | [**super**](https://github.com/arysociety/acey/blob/master/docs/examples.md#super)() | `ISuper` | return methods used by the **acey system**. |
    | [**sql**](https://github.com/arysociety/acey/blob/master/docs/examples.md#to)() | `SQLManager` | returns SQL methods to do on your Model's state |
    | [**to**](https://github.com/arysociety/acey/blob/master/docs/examples.md#to)() | `ITo` | return methods to **convert your Model's state** into different data types (like **string**, **JSON**..) |
    | [**mustValidateSchema**](https://github.com/arysociety/acey/blob/master/docs/examples.md#to)(state: Object) | `void` | Throw an error if the state passed in parameter doesn't match the Model's schema |
    
<br />

<br />

## Collection

<p align="center" font-style="italic" >
  <a>
    <img src="https://github.com/Fantasim/assets/blob/master/collection.png" width="100%">
  </a>
</p>

A Collection is a Model that has for state an array of Models.

#### Example - Article Collection
```ts
import { Collection, Model } from 'elzeard'
...
class ArticleCollection extends Collection {
    constructor(initialState: any, options: any){
        super(initialState, [ArticleModel, ArticleCollection], options)
    }
 
    create = (title: string, content: string) => {
      return this.quick().create({ title, content }) as ArticleModel
    }
    
    pull5LastArticles = () => {
      return this.quick().pull().orderBy('created_at', 'desc').limit(5).run() as ArticleCollection
    }
}
```

<br />

### Instanciation : `super(initialState: Array, nodeAndCo: [Model, Collection], options: IOption)`

<br />

- **Collection's values**:

    | Name | Type | Description |
    | -- | -- | -- |
    | [**state**](https://github.com/arysociety/acey/blob/master/docs/examples.md#state-1) |`Array` | return the current **Collection's state** |

<br />

- **Collection's methods**: 

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | [**hydrate**](https://github.com/arysociety/acey/blob/master/docs/examples.md#hydrate-1)(state: Array) | `IAction` | **fill the Collection's state** with the `Array` passed in parameter. |
    | [**is**](https://github.com/arysociety/acey/blob/master/docs/examples.md#is-1)() |`IsManager` | return **methods giving informations** about the **Collection's composition**. |
    | [**save**](https://github.com/arysociety/acey/blob/master/docs/examples.md#save-1)() |`IAction` | **Dispatch** the Collection's state to the Collection's store. |
    | [**setState**](https://github.com/arysociety/acey/blob/master/docs/examples.md#setstate-1)(state: Array) |`IAction` | **replace the state** by the one passed in parameter. |
    | [**super**](https://github.com/arysociety/acey/blob/master/docs/examples.md#super-1)() | `ISuper` | return methods used by the **acey system**. |
    | [**localStore**](https://github.com/arysociety/acey/blob/master/docs/examples.md#localstore-1)() |`LocalStoreManager`| **(Only if `connected` option is set to `true`)** return the **LocalStoreManager** to deal with the **Collection's local store** |
    | [**to**](https://github.com/arysociety/acey/blob/master/docs/examples.md#to-1)() | `ITo` | return methods to **convert your Collection's state** into different data types (like **string**, **JSON**..) |
    | [**watch**](https://github.com/arysociety/acey/blob/master/docs/examples.md#watch-1)() |`IWatchAction` | return methods to **watch changes** on the Collection's **state**, **store** and **local store** |
    | -- | -- | -- |
    | [**append**](https://github.com/arysociety/acey/blob/master/docs/examples.md#append)(values: (Collection or Object)[]) | `Collection` | Returns a fresh Collection with the Array passed in parameter **added at the end of the current Collection's state**. |
    | [**arrayOf**](https://github.com/arysociety/acey/blob/master/docs/examples.md#arrayof)(key: string) |`any[]` | Returns an **Array of value** for the `key` in **each element** of the `Collection`. |
    | [**chunk**](https://github.com/arysociety/acey/blob/master/docs/examples.md#chunk)(nChunk: number) |`Collection[]` | Returns an Array of collections **splited into groups of the length** of `nChunk`. |
    | [**concat**](https://github.com/arysociety/acey/blob/master/docs/examples.md#concat)(...list: any) |`Collection` | Creates a new Collection **concatenating the current state** with any values. |
    | [**count**](https://github.com/arysociety/acey/blob/master/docs/examples.md#count)() |`number` | Returns the **length** of the Collection's state |
    | [**copy**](https://github.com/arysociety/acey/blob/master/docs/examples.md#copy)() | `Collection` | Returns a **fresh instance** of the current Collection.
    | [**delete**](https://github.com/arysociety/acey/blob/master/docs/examples.md#delete)(v: Object or Model) | `IAction` | **Deletes** the `Model` passed in parameter **if present** in the list. |
    | [**deleteBy**](https://github.com/arysociety/acey/blob/master/docs/examples.md#deleteby)(predicate: any) | `IAction` | **Delete all** the nodes **matching** the **predicate** |
    | [**deleteIndex**](https://github.com/arysociety/acey/blob/master/docs/examples.md#deleteindex)(index: number) | `IAction` | **Remove** an element **at index**.
    | [**find**](https://github.com/arysociety/acey/blob/master/docs/examples.md#find)(predicate: any) | `Model or undefined` | **Find** the **first** node **matching** the predicate |
    | [**findIndex**](https://github.com/arysociety/acey/blob/master/docs/examples.md#findindex)(predicate: any) | `number` | Return the **index** of the **first node matching** the predicate |
    | [**filter**](https://github.com/arysociety/acey/blob/master/docs/examples.md#filter)(predicate: any) | `Collection` | Returns a new **Collection filled** with **list of node matching** the predicate |
    | [**filterIn**](https://github.com/arysociety/acey/blob/master/docs/examples.md#filterin)(key: string, arrayElems: any[]) | `Collection` | Returns a new **Collection filled** with the nodes for whom the `key`'s value is **equal** to **one of the value** in the `arrayElems` passed in parameter. |
    | [**first**](https://github.com/arysociety/acey/blob/master/docs/examples.md#first)() | `Model or undefined` | Returns the **head** node of the list
    | [**groupBy**](https://github.com/arysociety/acey/blob/master/docs/examples.md#groupby)(iteratee: any) | `IGrouped` | Returns an **object** composed of **keys generated** from the results of running each element of collection thru iteratee. The corresponding value of each key is a **Collection of elements** responsible for generating the key. |
    | [**indexOf**](https://github.com/arysociety/acey/blob/master/docs/examples.md#indexof)(v: Object or Model) | `number` | Gets the **index of a node** in the list.
    | [**last**](https://github.com/arysociety/acey/blob/master/docs/examples.md#last)() | `Model or undefined` | Returns the **tail** node of the list  
    | [**limit**](https://github.com/arysociety/acey/blob/master/docs/examples.md#limit)(n: number) | `Collection` | Returns a collection filled with the `n` **first nodes** of the list.  |
    | [**map**](https://github.com/arysociety/acey/blob/master/docs/examples.md#map)(callback: (v: Model, index: number) => any) | `any` | Creates a new array with the results of calling the `callback` for every Collection node (**same** than **javascript map** on arrays) |
    | [**newCollection**](https://github.com/arysociety/acey/blob/master/docs/examples.md#newcollection)(arr: Array) | `Collection` | Return **fresh instanced** Collection with `arr` passed in parameter | 
    | [**newModel**](https://github.com/arysociety/acey/blob/master/docs/examples.md#newmodel)(obj: Object) | `Model` | Return a **fresh instanced Collection's Model** built with `obj` passed in parameter | 
    | [**nodeAt**](https://github.com/arysociety/acey/blob/master/docs/examples.md#nodeat)(index: number) | `Model or undefined` | Returns the **node at `index`** in the list. |
    | [**offset**](https://github.com/arysociety/acey/blob/master/docs/examples.md#offset)(n: number) | `Collection` |  Returns a fresh instance of the collection removing the `n` **first nodes** of the list. |
    | [**orderBy**](https://github.com/arysociety/acey/blob/master/docs/examples.md#orderby)(iteratees: any[], orders: any[]) | `Collection` | Returns a **fresh Collection** with the nodes **sorted** upon the parameters passed |
    | [**pop**](https://github.com/arysociety/acey/blob/master/docs/examples.md#pop)() | `IAction` | **Remove** the **last node** in the list |
    | [**prepend**](https://github.com/arysociety/acey/blob/master/docs/examples.md#prepend)(values: Collection[] or Object[]) | `Collection` | Returns a fresh Collection with the **`Array`** passed in parameter **added at the beginning of the current Collection's state**. |
    | [**push**](https://github.com/arysociety/acey/blob/master/docs/examples.md#push)() | `IAction` | **Add** an element at the **end** in the list |
    | [**reduce**](https://github.com/arysociety/acey/blob/master/docs/examples.md#reduce)(callback: (accumulator: any, currentValue: any) => any, initialAccumulator: any) | `any` | Reduces Collection to a value which is the accumulated result of running each element in collection, where each successive invocation is supplied the return value of the previous. If initialAccumulator is not given, the first Model of Collection is used as the initial value. |
    | [**nth**](https://github.com/arysociety/acey/blob/master/docs/examples.md#nth)(index: number) | `Model or undefined` | Gets the **node at index n** of the Collection. If n is negative, the nth node from the end is returned.  |
    | [**shift**](https://github.com/arysociety/acey/blob/master/docs/examples.md#shift)() | `IAction` | **Remove** the **first** element |
    | [**slice**](https://github.com/arysociety/acey/blob/master/docs/examples.md#slice)(begin: number (optional), end: number (optional)) | `Collection` | Same than the slice method for arrays  |
    | [**splice**](https://github.com/arysociety/acey/blob/master/docs/examples.md#splice)(begin: number, nbToDelete[, elem1[, elem2[, ...]]]) | `Collection` | Same than the splice method for arrays  |
    | [**updateAt**](https://github.com/arysociety/acey/blob/master/docs/examples.md#updateat)(v: Object or Model, index: number) | `IAction` | **Updates** the element **at index** with the Model or Object passed in parameter |
    | [**updateWhere**](https://github.com/arysociety/acey/blob/master/docs/examples.md#updatewhere)(predicate: any, toSet: Object) | `IAction` | **Merges** the states of the Models **matching** the `predicate` **with `toSet`** Object value |
    | [**uniq**](https://github.com/arysociety/acey/blob/master/docs/examples.md#uniq)() | `IAction` | Returns a **new Collection** with **only unique** elements.|
    | [**uniqBy**](https://github.com/arysociety/acey/blob/master/docs/examples.md#uniqby)(iteratee: any) | `IAction` | Returns a **new Collection** with the `iteratee` by which **uniqueness** is computed. |
    
<br />

<br />

## Interfaces

<p align="center">
  <a>
    <img src="https://github.com/Fantasim/assets/blob/master/interfaces.png" width="100%">
  </a>
</p>


- **IOption (or Model's options)**: 

    | Name | Type | Default | Description |
    | -- | -- | -- | -- |
    | connected | `bool` | false | If **set to `true`** the Model is connected, so **it has a store**. *Can be connected to outside, like a react component.* |
    | key | `string` | "" | Model's **unique key**. *Optional for non-connected Models* |
    
<br />

- **IAction (or Model's actions)**:

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | **store**(expires = 365) | `IAction` | **(Only if `connected` option is set to `true`)**. **Transform the state** of the Model **to a string** and **store it in the localStore**. |
    | **save**() |`IAction` | **(Only if `connected` option is set to `true`)**. **Dispatch** the Model's **state** **to** Model's **store**. |
    
<br />

- **IWatchAction**:

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | **store**(callback: (prevStore, nextStore) => any) | `SubscribeAction` | **Execute the callback** passed in parameter **every time** the Model's **store changes**. It returns a `SubscriberAction` class with a `stop` method. |
    | **state**(callback: (prevStore, nextStore) => any) | `SubscribeAction` | **Execute the callback** passed in parameter **every time** the Model's **state changes**. It returns a `SubscriberAction` class with a `stop` method. |
    | **localStoreFetch**(callback: () => any) | `SubscribeAction` | **Execute the callback** passed in parameter **when** the Model **has just pulled its data stored in the local storage**. It returns a `SubscriberAction` class with a `stop` method. |
    
 <br />
    
- **IsManager**:

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | **collection**() |`boolean` | Returns `true` if the Model **is a collection** |
    | **connected**() |`boolean` | Returns `true` if the Model **is connected** to the store. |
    | **empty**() |`boolean` | Returns `true` if the Model's state **is empty** |
    | **equal**(m: Model) |`boolean` | Returns `true` if the Model's **state is equal to the one passed** in parameter. |
    | **localStoreEnabled**() |`boolean` | Returns `true` if the **localStore is enabled** with the Model |

<br />

- **OptionManager**:

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | **get**() | `IOptions` | Returns the **Model's option Object** |
    | **key**() | `string` | Returns the **Model's key** |
    | **kids**() | `Object` | Returns the **connected methods** of the Model (as options). You can then **pass this object as options for any instanced Model/Collection inside a connected Model**. *It will make them connected without separating them from each other.* |
    
<br />
    
- **LocalStoreManager** *(only React and Node)*: 

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | **get**() | `Object` | Returns the Model's **plain state stored** in the local store |
    | **isActive**() | `boolean` | Returns `true` if the **local store is enabled** on the Model |
    | **pull**() | `undefined` | Sets the data stored in the **Model's local store into the Model's state** | 
    | **remove**() | `undefined` | **Clears** the Model's **local store** |
    | **set**() | `IAction` | Sets the **Model's state into the local store** |

<br />

- **ISuper**:

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | **option**() | `IOptions` | Returns the Model's **options** |
    | **prevState** |`Object` | Returns the **previous state** |
    | **prevStateStore** |`Object` | Returns the **previous store** |
    
 
 <br />
 
 
- **ITO**:

    | Prototype | Return value | Description |
    | -- | -- | -- |
    | **listClass**(elems: any[]) | `Model[]` | (**Only if Collection**) Returns a list of instanced Models with the list of objects passed in parameter |
    | **string**() |`string` | Returns the state to **a JSON string** |
    | **plain**() |`string` | Returns the state to a **JS plain object/array** *(JSON format)* |
    
    
<br />
