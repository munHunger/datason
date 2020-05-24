const fs = require("fs");

const Index = {
  NONE: "none",
  TIME: "time",
};

class TableOptions {
  /**
   * @type {Index}
   */
  index;

  constructor(index) {
    Object.assign(this, { index: index || Index.NONE });
  }
}

class Table {
  /**
   * @type {string}
   */
  _url;
  /**
   * @type {string}
   */
  name;
  /**
   * @type {DataEntry[]}
   */
  entries;

  /**
   * @type {TableOptions}
   */
  options;
  constructor(url, name, options) {
    Object.assign(this, { name });
    this._url = url;
    this.entries = [];

    this.options = new TableOptions();
    Object.assign(this.options, options);

    fs.writeFileSync(
      `${this._url}/datason.json`,
      JSON.stringify(this.options, null, 2),
      "utf8"
    );
  }

  /**
   * @param {string} id
   * @param {*} data
   * @returns {Promise<Table>} this table once the data entry is saved
   */
  async register(id, data) {
    data = new DataEntry(`${this._url}/${id}.json`, id, data);
    return data.save().then((d) => {
      this.entries.push(d);
      this[id] = d;
      return this;
    });
  }

  async load() {
    return fs.promises.readdir(this._url, "utf8").then(async (data) => {
      return Promise.all(
        data
          .filter((file) => file !== "datason.json")
          .map((entry) =>
            fs.promises
              .readFile(`${this._url}/${entry}`, "utf8")
              .then((data) => {
                return new DataEntry(
                  `${this._url}/${entry}`,
                  entry.slice(0, -5),
                  JSON.parse(data)
                );
              })
              .then((entry) => {
                this.entries.push(entry);
                this[entry.id] = entry;
              })
          )
      ).then((_) => this);
    });
  }
}

class DataEntry {
  /**
   * @type {string} absolute path to json file
   */
  _url;
  /**
   * @type {string}
   */
  id;
  data;
  constructor(url, id, data) {
    Object.assign(this, { id, data });
    this._url = url;
  }

  async save() {
    return fs.promises
      .writeFile(this._url, JSON.stringify(this.data, null, 2), "utf8")
      .then((_) => this);
  }
}

class Database {
  url;
  /**
   * @type {Table[]}
   */
  tables;
  constructor(url) {
    Object.assign(this, { url });
    this.tables = [];
    this.connect(url);
  }

  /**
   * @param {string} tableName
   * @returns {Table}
   */
  get(tableName) {
    return this[tableName];
  }

  /**
   *
   * @param {string} tableName
   * @param {TableOptions} options
   */
  createTable(tableName, options) {
    if (!fs.existsSync(`${this.url}/${tableName}`))
      fs.mkdirSync(`${this.url}/${tableName}`);
    let table = new Table(`${this.url}/${tableName}`, tableName, options);
    this.tables.push(table);
    this[tableName] = table;
    return table;
  }

  /**
   * @returns {Promise<Database>}
   */
  async load() {
    return fs.promises.readdir(this.url, "utf8").then(async (data) => {
      return Promise.all(
        data.map((table) => this.createTable(table).load())
      ).then((_) => this);
    });
  }

  /**
   * @param {string} url a absolute path to the database
   */
  connect(url) {
    if (fs.existsSync(this.url)) {
      //Done
    } else if (fs.existsSync(url.split("/").slice(0, -1).join("/"))) {
      fs.mkdirSync(url);
    } else {
      this.connect(url.split("/").slice(0, -1).join("/"));
    }
  }
}

// let db = new Database("./newDb");
// db.createTable("table");
// db.get("table").register("1", { hello: "world" });
// db.createTable("time", { index: Index.TIME });
// db.time.register("2020", { some: "data" });
// db.table.register("test", { test: true }).then((table) => {
//   db.table.test.data.test = false;
//   db.table.test
//     .save()
//     .then((d) => console.log("saved\n" + JSON.stringify(d, null, 2)));
// });

module.exports = {
  Database,
  Table,
  DataEntry,
  TableOptions,
};
