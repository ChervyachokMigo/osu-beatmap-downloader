const fs = require('fs');

module.exports = async (path) => {
    return new Promise((res, rej) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                res(0);
            }
            res(stats.size);
        });
    });
};
