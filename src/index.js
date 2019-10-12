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
      items.map(item =>
        fs.promises.stat(`${folder}/${item}`).then(stat => {
          if (stat.isDirectory()) {
            state[item] = {
              register: (id, data) =>
                save(`${folder}/${name}/${id}.json`, data).then(_ => {
                  data.save = () => save(`${folder}/${name}/${id}.json`, data);
                  state[name][id] = data;
                  return data;
                })
            };
            return load(`${folder}/${item}`, state[item]);
          } else
            return fs.promises
              .readFile(`${folder}/${item}`, "utf-8")
              .then(data => JSON.parse(data))
              .then(data => {
                data.save = () => save(`${folder}/${item}`, data);
                let id = item.slice(0, -5);
                state[id] = data;
              });
        })
      )
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
