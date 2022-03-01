### Get started
```sh
yarn && yarn start
```

Create an article
```sh
curl --location --request POST 'http://localhost:3500/article' \
--header 'Content-Type: application/json' \
--data-raw '{
    "title": "First article",
    "content": "Some non-latin text :p"
}'
```

Get the list of articles
```sh
curl http://localhost:3500/article/all
```

Update an article
```sh
curl --location --request PUT 'http://localhost:3500/article/2' \
--header 'Content-Type: application/json' \
--data-raw '{
    "title": "Title updated",
    "content": "Some non-latin text :p"
}'
```

Delete an article
```sh
curl --location --request DELETE 'http://localhost:3500/article/1'
```