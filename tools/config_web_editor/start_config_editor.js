const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const { get_config, set_config, save_config_cache } = require('./config_cache');
const { log, isJSON } = require('../tools');
const { exec } = require('child_process');

module.exports = async () => {
	return await new Promise( (resolve, reject) => {
		const { WEBPORT } = get_config();
		const public_path = path.join ( __dirname, 'public' );

		const app = express();

		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: false }));
		
		app.use(express.static(public_path));

		app.on('error', (e) => {
			if (e.code === 'EADDRINUSE') {
				console.error('Address in use, retrying...');
				reject(e);
			} else {
				reject(e);
			}
		});

		app.post('/save', async (req, res) => {
			try{
				set_config(req.body);
				save_config_cache();	
				log('settings saved');
				res.send(true);
			} catch (e){
				console.error(e);
				reject(e);
			}
		});

		app.post('/load', async (req, res) => {
			try {
				log('settings sended to client');
				res.send(get_config());
			} catch (e){
				console.error(e);
				reject(e);
			}
		});

		app.post('/exit', async (req, res) => {
			try {
				log('exit config editor');
				res.send(true);
				resolve(true);
			} catch (e){
				console.error(e);
				reject(e);
			}
		});

		app.listen(WEBPORT, ()=>{
			log(`config editor listening on http://localhost:${WEBPORT}`);
			exec(`start http://localhost:${WEBPORT}`);
		});

	});
}
