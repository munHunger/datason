const fs = require("fs");

function save(path, data) {
  return fs.promises.writeFile(path, JSON.stringify(data, null, 2), "utf8");
}

function createTable(folder, name, state) {
  if (!fs.existsSync(`${folder}/${name}`)) fs.mkdirSync(`${folder}/${name}`);
  state[name] = {
    register: (id, data) =>
      save(`${folder}/${name}/${id}.json`, data).then(_ => {
        data.save = () => save(`${folder}/${name}/${id}.json`, data);
        state[name][id] = data;
        return data;
      })
  };
}

function load(folder, state) {
  return fs.promises.readdir(folder, "utf-8").then(items =>
    Promise.all(
      items.map(item => {
        fs.promises.fstat(`${folder}/${item}`).then(stat => {
          if (stat.isDirectory) {
            state[item] = {};
            return load(`${folder}/${item}`, state[item]);
          } else
            return fs.promises
              .readFile(`${folder}/${item}`, "utf-8")
              .then(data => JSON.parse(data))
              .then(data => {
                data.save = () => save(`${folder}/${item}`, data);
                state[item] = data;
              });
        });
      })
    )
  );
}

function connect(folder) {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  let state = {
    createTable: name => createTable(folder, name, state)
  };
  return load(folder, state).then(_ => state);
}

module.exports = {
  connect
};
