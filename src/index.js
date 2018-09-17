module.exports = new Promise((resolve, reject) => {
  // Load data
  require('./data/index')((err, data) => {
    if (err) reject(err);
    else {
      const dataController = require('./data/dataController')(data);
      resolve({ dataController, parser: require('./parse/parser')(dataController)});
    }
  });
});
