'use strict';

require( [

    'modules/DataGrid'

], function ( DataGrid ) {

    // Create a new DataGrid. We don't need to store this anywhere for later use.
	new DataGrid( { 
		url : 'https://spreadsheets.google.com/feeds/list/0AjbU8ta9j916dFBES3locHcxRGduQTEwNWMyeXVQU3c/1/public/basic?alt=json',
		containerEl : '#data-grid',
		headings : [ 'Ticker', 'Industry', 'Market Cap', 'Price', 'Change', 'Volume' ] 
	} );

} );