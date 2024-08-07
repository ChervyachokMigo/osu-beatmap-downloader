module.exports = (val) => {
	let status = 'ranked';

	switch (val){
        case 'qualified':
        case 'ranked':
        case 'loved':
        case 'pending':
        case 'graveyard':
		case 'wip':

		case 'any':

		case 'mine':
		case 'favourites':

            status = val;
            break;

        default:
            status = 'any';
            break;
    }

	return status;
}