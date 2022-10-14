<p align="center" font-style="italic" >
  <a>
    <img alt="elzeard" src="https://github.com/Fantasim/assets/blob/master/elzeard-baneer.png?raw=true" width="100%">
  </a>
  + Maintanability. | - Code Redundancy. | - Debugging. | + Productivity.
</p>

<br />

<br />

<br />

<br />

# OOP ORM based on Knex and Joi. 🌿

## Introduction

Elzeard is an OOP ORM built on top of **[Knex](https://github.com/knex/knex)**, and **[Joi](https://joi.dev/api/?v=17.6.0)** : Two **main** JS libraries when it's about **maintaining code organization** and **securizing** back-end apps.

⚠️ The current version **only** works with a **MySQL/Maria database**

<br />


#### 1. Quick intro with **[Knex](https://github.com/knex/knex)** : SQL query builder

Building SQL queries is an annoying and redundant task. Knex answers to that problem by greatly symplifying the query building process:

Without it:
```sql
select * from `users` where `id` = 1
```

With it:
```js
knex('users').where('id', 1)
````

<br />

#### 2. Quick intro with **[Joi](https://joi.dev/api/?v=17.6.0)** : Schema descriptor and data validator

- Data formating + treating
- Rendering errors when needed (ex: POST/PUT req in an API) 
- Defining Model schema 

are also an annoying and redundant task.

With Joi, you can define a schema and generate well-transcripted errors when a data doesn't match its model.

Example:
```js
const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    access_token: Joi.token()
    birth_year: Joi.number().integer().min(1900).max(2013),
    email: Joi.string().email()
})

schema.validate({ username: 'abc', birth_year: 1994 });
// -> { value: { username: 'abc', birth_year: 1994 } }

schema.validate({});
// -> { value: {}, error: '"username" is required' }
```

<br />

#### 3. Quick intro with **[Joi x SQL](https://github.com/elzeardjs/joixsql)** : Combination of both integrated in Elzeard

Table and column management when iterating on a back-end application is an everyday task that can be removed with automation.
We did it, and it is one of the main feature of Elzeard.

Quick example [here](https://github.com/elzeardjs/joixsql/tree/master/example)


<br />

<br />

<br />

<br />

<br />

<br />

<p align="center">

  <img width="5%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>
  
  <a href="#get-started">
    <img width="15%" src="https://siasky.net/EABzcACQz3Xj32CtjaVgNBM56fJgUPm0RTMkYZF7uysKwQ"/>
  </a>

  <img width="5%" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"/>

  <a target="_blank" href="https://github.com/elzeardjs/elzeard/tree/master/examples">
    <img width="15%" src="https://siasky.net/EAABjRbonXUkzrt1jQ1yEVr--jLoMP4zxgPY7j_TRgSzlA"/>
  </a>
</p>

<br />

<br />

<br />

<br />




# Get Started
## Usage

```
yarn add elzeard
```

<br />

After all your collections have been instanced, set your configuration and make it 'done':

```js
import { config } from 'elzeard'
import MyCollection1 from './my-collection-1'
import MyCollection2 from './my-collection-2'
import { startServer } from './server'
...

const myCollect1 = new MyCollection1([], {table: 'collection-1'})
const myCollect2 = new MyCollection2([], {table: 'collection-2'})
...

const initConfig = async () => {
  await config.done()
  ...
}

initConfig()
startServer()
```


