const fs = require("fs");
const db = require("./index");

function deleteFolder(folder) {
  fs.readdirSync(folder, "utf8").forEach(item => {
    if (fs.lstatSync(folder + "/" + item).isDirectory())
      deleteFolder(folder + "/" + item);
    else fs.unlinkSync(folder + "/" + item);
  });
  fs.rmdirSync(folder);
}

describe("Initialize database", () => {
  beforeEach(() => deleteFolder("./data"));
  it("creates folder upon connect", () => {
    db.connect("./data");
    expect(fs.existsSync("./data")).toBeTruthy();
  });
  it("can create tables", () => {
    db.connect("./data").then(db => {
      db.createTable("table");
      expect(fs.existsSync("./data/table")).toBeTruthy();
    });
  });
});

describe("Database exists with table", () => {
  let test;
  beforeEach(() => {
    deleteFolder("./data");
    return db.connect("./data").then(db => {
      test = db;
      test.createTable("test");
    });
  });
  it("can register an object", () => {
    test.test
      .register("data", { a: "b" })
      .then(_ => expect(fs.existsSync("./data/test/data.json")).toBeTruthy());
  });
  it("returns the object after registering", () => {
    test.test
      .register("data", { a: "b" })
      .then(data => expect(data.a).toBe("b"));
  });

  describe("Has data", () => {
    beforeEach(() => test.test.register("data", { a: "b" }));
    it("can access the object with dot notation", () => {
      expect(test.test.data.a).toBe("b");
    });

    it("can load the data", () => {
      db.connect("./data").then(loaded => expect(loaded.test.data.a).toBe("b"));
    });

    it("can save updates", () => {
      test.test.data.a = "c";
      test.test.data.save().then(_ => {
        db.connect("./data").then(loaded =>
          expect(loaded.test.data.a).toBe("c")
        );
      });
    });
  });
});
