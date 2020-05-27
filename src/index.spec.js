const fs = require("fs");
const { Database, Table, TableOptions, DataEntry, Index } = require("./index");

function deleteFolder(folder) {
  if (!fs.existsSync(folder)) return;
  fs.readdirSync(folder, "utf8").forEach((item) => {
    if (fs.lstatSync(folder + "/" + item).isDirectory())
      deleteFolder(folder + "/" + item);
    else fs.unlinkSync(folder + "/" + item);
  });
  fs.rmdirSync(folder);
}

describe("Testing datason", () => {
  beforeAll(() => deleteFolder("./data"));
  afterAll(() => deleteFolder("./data"));

  describe("Initialize database", () => {
    afterEach(() => deleteFolder("./data"));
    beforeEach(() => deleteFolder("./data"));
    it("creates folder upon connect", () => {
      expect(fs.existsSync("./data")).toBeFalsy();
      new Database("./data");
      expect(fs.existsSync("./data")).toBeTruthy();
    });
    it("can create tables", () => {
      expect(fs.existsSync("./data/table")).toBeFalsy();
      let database = new Database("./data");
      database.createTable("table");
      expect(fs.existsSync("./data/table")).toBeTruthy();
    });
  });

  describe("database exists with time indexed table", () => {
    /**
     * @type {Database}
     */
    let db;
    beforeAll(() => {
      db = new Database("./data");
      db.createTable("time", { index: Index.TIME });
    });
    it("indexes data based on time", async () => {
      let times = [new Date().getTime()];
      return db
        .get("time")
        .register("1", { a: 1 })
        .then((_) => new Promise((resolve) => setTimeout(resolve, 10)))
        .then(async (_) => {
          times.push(new Date().getTime());
          return db
            .get("time")
            .register("2", { a: 2 })
            .then((_) => new Promise((resolve) => setTimeout(resolve, 10)))
            .then((_) => {
              times.push(new Date().getTime());
              expect(db.get("time").getFrom(times[0]).length).toBe(2);
              expect(db.get("time").getFrom(times[1]).length).toBe(1);
              expect(db.get("time").getFrom(times[2]).length).toBe(0);
            });
        });
    });
  });

  describe("database exists with table", () => {
    /**
     * @type {Database}
     */
    let db;
    beforeAll(() => {
      db = new Database("./data");
      db.createTable("test");
    });

    it("can register an object", () =>
      db.test
        .register("dot", { a: "b" })
        .then((_) =>
          expect(fs.existsSync("./data/test/dot.json")).toBeTruthy()
        ));

    it("returns the object after registering", () =>
      db
        .get("test")
        .register("a", { b: "c" })
        .then((data) => {
          expect(data.a.data.b).toBe("c");
        }));

    describe("table has data", () => {
      beforeAll(() => {
        db.createTable("data");
        return db.get("data").register("testData", { hello: "world" });
      });

      it("can reach the data with dot notation", () => {
        expect(db.data.testData.data.hello).toBe("world");
      });

      it("can load the data", () =>
        new Database("./data").load().then((db) => {
          expect(db.get("data").testData.data.hello).toBe("world");
        }));

      it("can update saved data", async () => {
        /**
         * @type {DataEntry}
         */
        let data = db.get("data").testData;
        data.data.updated = true;
        return data.save().then(async (_) => {
          return new Database("./data").load().then((db) => {
            expect(db.get("data").testData.data.updated).toBeTruthy();
          });
        });
      });
    });
  });
});
