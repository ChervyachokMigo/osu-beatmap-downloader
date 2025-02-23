const { rmSync, readFileSync, writeFileSync } = require("original-fs");
const { last_cursor_path } = require("../misc/pathes");

module.exports = {
    save_last_cursor: (cursor) => {
        writeFileSync(last_cursor_path, JSON.stringify ({cursor}), {encoding: 'utf8'});
    },

    load_last_cursor: () => {
        try {
            const res = JSON.parse(readFileSync(last_cursor_path, {encoding: 'utf8'}));
            return res.cursor;
        } catch (e) {
            return null;
        }
    },

    is_continue_from_cursor: (is_continue) => {
        if (is_continue === 'no') {
            try{ 
                rmSync(last_cursor_path);
            } catch (e) {}
        }
    }
}