var { v2 } = require('osu-api-extended');

module.exports = async () => {
    return (await v2.user.me.download.quota()).quota_used;
}
