module.exports = (val) => {
	let status = 'ranked';

	switch (val){
        case 'qualified':
        case 'ranked':
        case 'loved':
        case 'pending':
        case 'graveyard':
            status = val;
            break;

        default:
            status = 'ranked';
            break;
    }

	return status;
}