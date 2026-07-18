const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  var dir = req.query.path || '';
  var fsPath = path.join(process.cwd(), 'js/plugins', dir);

  try {
    var items = fs.readdirSync(fsPath);
    var files = items.filter(function(f) { return f.endsWith('.js'); });
    var links = files.map(function(f) {
      return '<a href="' + f + '">' + f + '</a>';
    }).join('\n');
    res.setHeader('Content-Type', 'text/html');
    res.status(200).end('<html><body>' + links + '</body></html>');
  } catch (e) {
    res.status(404).end('Not found: ' + fsPath);
  }
};
