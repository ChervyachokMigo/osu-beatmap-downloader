const ps = require('child_process');

module.exports = (token, id) => {
    const headers = `Authorization: Bearer ${token}`;
    const url = `https://osu.ppy.sh/api/v2/beatmapsets/${id}/download`;

    const url_info = ps.execSync(`curl -s -H "${headers}" -I "${url}" `).toString().split('\n');
    try {
    const url_file = url_info.filter( (val)=>val.startsWith('Location')).shift();

    if (url_file){
        const temp_file_path = url_file.replace('Location: ', '')
        .trim();

        const output = ps.execSync(`curl -s -H "${headers}" -I "${temp_file_path}" `)
        .toString()
        .split('\n')
        .filter( (val)=>val.startsWith('Content-Length'))
        .shift()
        
        if (output){
            const file_size = output.replace('Content-Length: ', '')
            .trim();
            return {size: file_size}
        } else {
            return {error: 'No file size'}
        }

    } else {
        return {error: 'No file url'}
    }


    } catch (e) {
        if (url_info.includes('Too Many Requests')){
            return {error: 'Too Many Requests'}
        } else {
            throw new Error(e)
        }
    }
    
}
