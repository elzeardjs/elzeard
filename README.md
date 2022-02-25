<p align="center" font-style="italic" >
  <a>
    <img alt="elzeard" src="https://siasky.net/IAAgFQE1V1et5JmmXPNlG5tki-5YG8v4HYXbmRBdmxItgg" width="100%">
  </a>
  + Maintanability. | - Code Redundancy. | - Debugging. | + Productivity.
</p>

<br />

<br />

<br />

<br />

# Build complex node apps with as much code as efforts. 🌿

## Introduction

Elzeard is a framwork built on top of **[Knex](https://github.com/knex/knex)**, and **[Joi](https://joi.dev/api/?v=17.6.0)** : Two **main** JS libraries when it's about **maintaining code organization** and **securizing** back-end apps.

<br />


#### 1. **[Knex](https://github.com/knex/knex)** : SQL query builder

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

#### 2. **[Joi](https://joi.dev/api/?v=17.6.0)** : Schema descriptor and data validator

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

#### 3. **[Joi x SQL](https://github.com/elzeardjs/joixsql)** : Combination of both integrated in Elzeard

Table and column management when iterating on a back-end application is an everyday task that can be removed with automation.
We did it, and it is one of the main feature of Elzeard.

Quick example [here](https://github.com/elzeardjs/table-automation-example)





<br />

<br />

<br />



*inspired from **[Acey](https://github.com/AceyJS/acey)** (OOP State Manager)*
