# Datason

![test](https://github.com/munHunger/datason/workflows/test/badge.svg?branch=master)

A database consisting of json files on disk.

Every table is a directory and every object is a json file... the way it should be.

## Docs

Saving an object is easy.

```
const db = require("datason");

db.connect("<path to db dir>").then(db => {
    db.createTable("table");
    db.table.register("id", { data: "hello world" })
})
```

The object will then be created and accessible via dot notation, i.e. `db.table.id.data.data === "hello world"`

Updating a registered object is super easy!

```
table.register("id", { data: "hello world" })
table.id.data.data = "hello universe"
table.id.data.data.save.then(_ => console.log("save complete"))
```

Loading should never be explicitly required so when calling `connect` it will load the database into memory.
