TR Tech Test
============

A repo for a technical test that I've just completed, for a client who will remain anonymous.

Viewing the (results of the) test
---------------------------------

Navigate to the following GitHub page in your browser of choice:

[http://dannycallaghan.github.io/trtechtest/](http://dannycallaghan.github.io/trtechtest/ "TR Tech Test")

Viewing the (results of the) test locally
-----------------------------------------

1.  Clone the repo, or download and extract the zip.
2.  Navigate to dist/ and open index.html in your browser of choice.

Notes
-----

*   The data is hosted, as a Google Sheet, in the following location:

	[https://docs.google.com/spreadsheet/ccc?key=0AjbU8ta9j916dFBES3locHcxRGduQTEwNWMyeXVQU3c&usp=sharing](https://docs.google.com/spreadsheet/ccc?key=0AjbU8ta9j916dFBES3locHcxRGduQTEwNWMyeXVQU3c&usp=sharing "TR Tech Test Google Sheet")

*   The table is initialised by calling the following:

	````
	new DataGrid( { 
		url : 'https://spreadsheets.google.com/feeds/list/0AjbU8ta9j916dFBES3locHcxRGduQTEwNWMyeXVQU3c/1/public/basic?alt=json',
		containerEl : '#data-grid',
		headings : [ 'Ticker', 'Industry', 'Market Cap', 'Price', 'Change', 'Volume' ] 
	} );

	where:

	1.	*url* is the URL of the data resource.
	2.	*containerEl* is the DOM element to inject the data table (should there be any data to display).
	3.	*headings* is an array containing the column headings (see Column Headings below).

Column Headings
----------------------------------------------

Why do I specify the column headings in the code? It seems there are two way of getting the spreadsheet data - specifying *cells* or *list*. *cells* returns each and every spreadsheet cell, individually, labelled by their spreadsheet reference (A1, C56, etc) - this seemed like a bad idea as the resource becomes very large, and the data would be a nightmare to parse and to associate. *list* returns the data in a much friendlier way (although still quite frustrating) but the column headings contain no white space.

One of our required columns is 'Market Cap'. I'm pretty certain that there is no bulletproof way of knowing that the string 'marketcap' (contained in the returned data) should be formatted as 'Market Cap' - as opposed to 'Mark Etcap', 'Mar Ketcap', 'M.A.R.K.E.T Cap', or any other pattern. As a result, I took the decision to pass the column names in the initialisation block.

Of course, this does have an added bonus - don't want to show one or more of the columns in the spreadsheet (perhaps those columns are not relevant to the content of your page or site)? Don't specify them in the initiasation block. There is logic in the code to ensure that a table cell is only rendered if it is associated with a passed header.

Red/green Text Colours For *Change*
-------------------

There seemed no way to know that the *Change* column text should have extra CSS applied to it, and not the others. My preference would be to have passed that as an argument to the initialisation block. Something like:

	headings : [ 'Ticker : { 'color' : false }', 'Industry : { 'color' : false }', 'Market Cap : { 'color' : false }', 'Price : { 'color' : false }', 'Change : { 'color' : true }', 'Volume : { 'color' : false }' ], ...

But then I felt I was going too far down the route of just specifying everything in the code - why not also pass the data type too? Or the default sort-by column? And so on. So - as the colours are very obviously a visual representation of positive and negative values - I took the decision to see if a column value's first character is a minus. If it is, we colour that column. Of course, this does mean that if all values happen to be positive, that column will be the default colour, and not green (as how would we differentiate that from the *Volume* column, for example). Not a nice solution, but it works.

Browsers
-------------------

Tested in the latest versions of Chrome and Firefox, and Internet Explorer 10.


