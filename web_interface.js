const path = require('path');
const electron = require('electron');
const express = require('express');
const bodyParser = require('body-parser');

const web = express();

web.use(bodyParser.json());
web.use(bodyParser.urlencoded({ extended: false }));

const HTTP_PORT = 4444;
const webserver_dir = 'web';

const PathListener = (webserver_descriptor, filepath, filename) =>{
    webserver_descriptor.get(filepath, (req, res) => {
        res.sendFile(path.join(__dirname, webserver_dir, filename));
    });
}

var beatmaps = [];

web.get('/beatmaps_status', (request, response) => response.json( beatmaps ) );

module.exports = {
    init: 
        async () => {

        PathListener(web, '/', 'index.html');
        PathListener(web, '/jquery.min.js', 'jquery.min.js');
        PathListener(web, '/styles.css', 'styles.css');

        web.listen(HTTP_PORT, ()=>{
            console.log(`Scores listening on http://localhost:${HTTP_PORT}`);
        });

        web.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error('Address in use, retrying...');
            }
        });

        function createWindow() {
            const win = new electron.BrowserWindow({
                width: 1280,
                height: 768,
                webPreferences: {
                    nodeIntegration: true
                }
            });
            win.loadURL('http://localhost:'+HTTP_PORT+"/");
        }
        
        electron.app.whenReady().then(() => {
            createWindow();

            electron.app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) {
                    createWindow();
                }
            });
        });

        electron.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                electron.app.quit();
            }
        });

    },

    update_beatmap: (id, data) => {
        let is_founded = false;
        beatmaps.forEach((element, index) => {
            if(element.id === id) {
                
                if (data.mode){
                    beatmaps[index].data.mode = data.mode;
                }
                if (data.artist){
                    beatmaps[index].data.artist = data.artist;
                }
                if (data.title){
                    beatmaps[index].data.title = data.title;
                }
                if (data.progress){
                    beatmaps[index].data.progress = data.progress;
                }
                if (data.filesize){
                    beatmaps[index].data.filesize = data.filesize;
                }

                is_founded = true;
            }
        });
        if (is_founded == false) {
            beatmaps.push( {id, data} );
        }
    },
    
}



