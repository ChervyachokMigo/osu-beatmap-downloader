const net = require('net');

module.exports = async (port) => {
	const res = await new Promise((resolve, reject) => {
		const server = net.createServer();

		server.once('error', function(err) {
			if (err.code === 'EADDRINUSE') {
				resolve(false);
			} else {
				reject(err);
			}
		});

		server.once('listening', function() {
			server.close();
			resolve(true);
		});

		server.listen(port);
	});
	return res;
}