const ps = require('child_process');

module.exports = (token, id) => {
    const headers = `Authorization: Bearer ${token}`;
    const url = `https://osu.ppy.sh/api/v2/beatmapsets/${id}/download`;
    const temp_file_path = ps.execSync(`curl -s -H "${headers}" -I "${url}" `).toString().split('\n').filter( (val)=>val.startsWith('Location')).shift().replace('Location: ', '').trim();
    const file_size = ps.execSync(`curl -s -H "${headers}" -I "${temp_file_path}" `).toString().split('\n').filter( (val)=>val.startsWith('Content-Length')).shift().replace('Content-Length: ', '').trim();
    return file_size
}
