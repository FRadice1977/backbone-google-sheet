'use strict';

define( [

    'backbone',
    'underscore',

    'text!../templates/data-headers.jst',
    'text!../templates/data-row.jst'

], function ( Backbone, _, tableHead, tableRow ) {

	var DataGrid = function ( options ) {

		// Default settings
		var defaults = {},
			config = _.extend( defaults, options ),
			initialize = function () {
				// If we don't have a URL, don't continue. Could test for a script ID
				// (where the JSON might reside)instead, for example, but for this, let's quit.
				if ( !config.url || !config.url.length ) {
					return;
				}
				// similarly, if there is no DOM element to hook onto, quit
				if ( config.containerEl.length === 0 ) {
					return;
				}
				// If we're still here, create the entry point into the app...
				new DGTableRouter();
				// ... and start the app
				Backbone.history.start();
			},

			// Store any app wide utils here
			utils = {
				// Shows a system message
				showMessage : function ( el, text ) {
					if ( el .children( 'p.message' ).length === 0 ) {
						el.prepend( $( '<p>' ).addClass( 'message' ) ).addClass( 'notify' );
					}
					el.children( 'p.message' ).text( text );
				}
			},

			// App router
			// We're using a router as we may want to add routes lates (perhaps #volume would automagically sort on volume?)
			DGTableRouter = Backbone.Router.extend( {
				routes : {
					'' : ''
				},
				initialize : function () {
					// Begin rendering the app
					new DGTableView();
				}
			} ),
			
			// The main view, for the table itself
			DGTableView = Backbone.View.extend( {
				el : $( config.containerEl ),
				initialize  : function ( options ) {
					var self = this;
					// Create a collection to store the table rows
					this.collection = new DGTableRowsCollection();
					// Start the rendering process whenever the collection is reset or sorted
					this.collection.on( 'reset', this.onFetchItems, this );
					this.collection.on( 'sort', this.onFetchItems, this );
					// Populate the collection from the server
					this.collection.fetch( {
						reset : true,
	          			error : function ( model, response, options ) {
	          				utils.showMessage( self.$el, 'Sorry, we cannot retrieve the requested information. Please try again later.' );
	          			}
	          		} );
				},
				// We now have a collection to work with
				onFetchItems : function () {
					var self = this;
					if ( this.collection.length ) {
						// We're only interested in rendering *any* of the table if we have data to show
						this.generateHTML();
						this.renderHeader();
						// Clear the tbody, in case we're rerendering
						this.$el.find( 'tbody' ).empty();
						this.collection.each( function ( item ) {
							// Now render each table row
							self.renderRow( item );
          					//self.renderItem( self.formatItemForRender( self, item ) );
        				} ); 
					} else {
	          			utils.showMessage( self.$el, 'Sorry, there is no information to display.' );
					}
					this.renderComplete();
				},
				// Generate the TABLE HTML
				generateHTML : function() {
					if ( this.$el.children( 'table' ).length ) { return; }
					this.$el.append( 
						$( '<table>' )
							.append(
								$( '<tbody>' )
							)
							.append(
								$( '<thead>' )
							)
							.addClass( 'data-table')
					);
				},
				// Set up the table header model, and pass it to it's own view, returning and apending the result to this main view
				renderHeader : function () {
					// We only want to render the header once
					if ( this.$el.find( 'thead' ).children().length ) { return; }
					// Pass the config.headings as the model's data
					var header = new DGTableHeaderModel( { items : config.headings } ),
						headerView = new DGTableHeaderView( { model : header, collection : this.collection } ); 
					this.$el.find( 'thead' ).append( headerView.render().el );
				},
				// Set up each table row, and pass it to it's own view, returning and appending the result to thsi main view
				renderRow : function ( row ) {
					var rowView = new DGTableRowView( { model : row, collection : this.collection } );
                	this.$el.find( 'tbody' ).append( rowView.render().el );
				},
				// Feels a little cheeky, but the fact is, there are some things we don't know 
				// about how to display the table until the data is injected. And those 'design changes'
				// can't really be placed elsewhere. Those things can be placed here :)
				renderComplete : function () {
					// Cache the first row only - we don't need to look at every cell in the table
					var firstRowCells = this.$el.find( 'tbody' ).find( 'tr' ).first().children();
					$.each( firstRowCells, function () {
						// We're dealing with header only, so cache it
						var header = $( 'th#' + $( this ).attr( 'headers' ) );
						// Find where we've right aligned a table cell in the template, and right align their column heading
						if ( $( this ).hasClass( 'align-right' ) ) {
							header.addClass( 'align-right' );
						}
						// As this data is available to us already in the DOM, let's add the column data type to the headings
						header.data( 'type', $( this ).data( 'type' ) );
					} );
					// Show the table (we can do this each time, no performance concerns with this)
					this.$el.addClass( 'complete' ).children( 'table.data-table').show();
					// By now, any models that have been rendered that contained a minus number have populated the colorCols array
					if ( config.colorCols ) {
						// Create CSS rules rather than changing each element using .css() (more performant)
						var styles = [];
						_.each( config.colorCols, function ( element, index, list ) {
							styles.push( ".data-table tbody tr td[headers=" + element + "] { color: #0aa000 !important; }\n" );
							styles.push( ".data-table tbody tr td[headers=" + element + "].red { color: #aa0000 !important; }\n" );
						} );
						this.embedCSS( styles );
					}
				},
				// Add CSS to the document
				embedCSS : function ( css ) {
					var head = $( 'head' ),
						style = $( '<style>' ).attr( 'type', 'text/css' ).text( css.join( '' ) );
					head.append( style );
				} 
			} ),
	
			// Model for the table header
			DGTableHeaderModel = Backbone.Model.extend( {
				default : {
					items : []
				},
				// We're using the ID and HEADERS attributes to link the TH with its TDs,
				// so format each heading's text to use as the TH's ID attribute value
				getHeaderIds : function () {
					var ids = [];
					_.each( this.get( 'items' ), function ( element, index, list ) {
						ids.push( element.replace( " ", "" ).toLowerCase() );
					} );
					return ids;
				}
			} ),
		
			// The view for the table header, gets appended to the main view
			DGTableHeaderView = Backbone.View.extend( {
				tagName : 'tr',
				template : _.template( tableHead ),
				events : {
					'click a' : 'sort'
				},
				// Sort the columns, toggling between ASC and DESC
				sort : function ( e ) {
					e.preventDefault();					
					var target = $( e.target ).parent(),
						sortOn = target.attr( 'id' );
						// Decides direction on whether it has the 'desc' class name
						sortDir = target.hasClass( 'asc' ) ? 'desc' : 'asc';
					// Set order params and sort
					this.collection.setSortParams( sortOn, sortDir );
					this.collection.sort();
					// Toggle the 'desc' class
					target.toggleClass( 'asc' );
					// Add a sort class to this column
					target.parents( 'tr' ).children( 'th.sort' ).removeClass( 'sort' );
					target.addClass( 'sort' );
				},
				// Get the model to do any data/view specific formatting before we render the data
				// so that it's in a state to spit out
				getRenderData : function () {
					var data = {
						ids : this.model.getHeaderIds()
					}
					return _.extend( {}, this.model.toJSON(), data );
				},
				// Return the rendered view
				render : function () {
					this.$el.html( this.template( this.getRenderData() ) );
					return this;
				}
			} ),

			// Model for each table row
			DGTableRow = Backbone.Model.extend( {
				defaults : {},
				// The model's data isn't right for rendering yet (nested info, etc)
				// so run some housekeeping on it first before passing it to the view
				formatCellInfomation : function () {
					// Set up an object to store all of the table cell attributes and value
					var cells = {};
					// Because of the way Google builds the JSON, we have to *assume*
					// that feed.entry.title.$t is our first table column. Bit rubbish.
					// Call getDataType here, as it returns two values, but we only want to call it once
					var temp = this.getDataType( this.get( 'title' ).$t, this.formatIdName( config.headings[ 0 ] ) );
					// Set up our first column
					cells[ this.formatIdName( config.headings[ 0 ] ) ] = {
						'value' : this.get( 'title' ).$t,
						'type' : temp.type,
						'sort' : temp.sort,
						'minus' : temp.minus
					}
					// The rest of the columns are contained in feed.entry.content.$t! So parse that.
					var values = this.parseContent( this.get( 'content' ).$t );
					// Then add the resuts to our exiting cells object
					cells = _.extend( cells, values );
					// Return the finished product
					return cells;
				},
				// Utility function to make a string ID worthy
				formatIdName : function ( str ) {
					return str.replace( " ", "" ).toLowerCase();
				},
				// Utility function to determine the data type
				getDataType : function ( data, title ) {
					// Assume it's a string...
					var type = 'string',
						sort = data,
						minus = false;
					// ... unless it matches the regex
					if ( !_.isNull( data.match(/£?[0-9]+[\.,]?[0-9,\.]*%?/) ) ) {
						type = 'int';
						// I don't like this, but can't see how else to do it...
						// If a column has a minus number, we're going to colour the values red (for minus numbers)
						// and green (for plus numbers). So add the column name to our config, so we can style it
						if ( data.charAt( 0 ) === '-' ) {
							if ( config.colorCols ) {
								if ( !_.contains( config.colorCols, title ) ) { 
									config.colorCols.push( title );
								}
							} else {
								config.colorCols = [ title ];
							}
							minus = true;
						}
						// Remove unwanted characters and store this so we can use it to sort and make sure it's sorted as a
						// float rather than a string
						sort = parseFloat( data.replace(/[,£%]/g,'') );
					}
					return {
						type : type,
						sort : sort,
						minus : minus
					}
				},
				// Parse and return feed.entry.content.$t
				parseContent : function ( content ) {
					// Split the text...
					var chunks = content.split( ', ' ),
						self = this,
						cells = {};
					// ... and loop over the result
					_.each( chunks, function ( element, index, list ) {
						// Split it again
						var parts = element.split( ': '),
							// Do this function here, so we only call it once
							data = self.getDataType( parts[ 1 ], self.formatIdName( parts[ 0 ] ) );
						// Build our cell object
						cells[ self.formatIdName( parts[ 0 ] ) ] = {
							'value' : parts[ 1 ],
							'type' : data.type,
							'sort' : data.sort,
							'minus' : data.minus
						}
					} );
					// Return all cells
					return cells;
				}
			} ),

			// Collection containing each of the table rows
			DGTableRowsCollection = Backbone.Collection.extend( {
				model : DGTableRow,
				url : config.url,
				// As we using JSONP, we need to override the built in Backbone fetch()
				sync : function( method, model, options ) {
			        var params = _.extend( {
			            type: 'GET',
			            dataType: 'jsonp',
			            url: this.url,
			            processData: false
			        }, options );
			        return $.ajax(params);
			    },
			    // The JSON returned isn't collection friendly for our needs (the items are nested further down),
			    // so parse the response before passing it on
				parse : function( response ) {
					// This is what we need
        			var data = response.feed.entry;
        			// But they have IDs, and Backbone will think they're duplicates, so drop the ID
					data = _.map( data, function( item ) {
						var obj = _.omit( item, 'id' );
						return obj;
					} );
    				return data;
    			},
    			// Sets the field to sort on, and the direction (ascending or descending)
    			// to be used by the collection comparator
   				setSortParams : function ( field, direction ) {
   					if ( field ) {
       					this.sortField = field;
       				}
       				this.sortDirection = direction || 'asc';
   				},
   				// Sort by. Uses the default order the first time around
   				comparator : function ( item ) {
       				// First time this fires (automagically) don't do anything
       				if ( !this.sortField || !item.get( 'cells' )[ this.sortField ] ) {
       					return;
       				}
       				// This is what we're going to sort on
       				var sort = item.get( 'cells' )[ this.sortField ].sort;
       				if ( this.sortDirection.toUpperCase() === 'DESC' ) {
       					// Backbone doesn't sort strings in reverse properly. This is a bit of a hack, but it works
       					if ( item.get( 'cells' )[ this.sortField ].type === 'string' ) {
       						sort = sort.toLowerCase();
							sort = sort.split("");
							sort = _.map( sort, function( letter ) { 
								return String.fromCharCode( -( letter.charCodeAt( 0 ) ) );
							} );
       					} else {
       						// It does reverse ints OK, so we just need to negate the order
       						sort = -item.get( 'cells' )[ this.sortField ].sort;
       					}
       				}
       				return sort;
   				}
			} ),

			DGTableRowView = Backbone.View.extend( {
				tagName : 'tr',
				template : _.template( tableRow ),
				events : {
					'mouseenter td' : 'highlight',
					'mouseleave td' : 'highlight'
				},
				// Highlight the column and row on hover
				highlight : function ( e ) {
					var cell = $( e.target ),
						row = cell.parent(),
						column = row.parent().find( 'td[headers|="' + cell.attr( 'headers' ) + '"]');
					row[ e.type === 'mouseenter' ? 'addClass' : 'removeClass' ]( 'over' );
					$.each( column, function () {
						$( this )[ e.type === 'mouseenter' ? 'addClass' : 'removeClass' ]( 'over' );
					} );
			    },
				// Get the model to do any data/view specific formatting before we render the data
				// so that it's in a state to spit out. Also, add the formatted headings, so we confirm
				// that each column *should* be rendered. As well as making sure we don't mess things up,
				// this will allows users to specify which data to display. Only do this once - not after sorting
				getRenderData : function () {
					if ( _.isUndefined( this.model.get( 'cells' ) ) ) {
						var headerIds = [], data;
						_.each( config.headings, function ( element, index, list ) {
							headerIds.push( element.replace( " ", "" ).toLowerCase() );
						} );
						this.model.set( 'cells', this.model.formatCellInfomation() );
						this.model.set( 'headings', headerIds );
						// Save these new look models in our collection (or we'll lose everything after sorting)
						this.collection.set( this.model, { remove : false } );
					}
					return this.model.toJSON();
				},
				// Return the rendered view				
				render : function () {
					var data = this.getRenderData();
					this.$el.html( this.template( data ) );
					return this;
				}
			} )

		;

		initialize();

	};

	return DataGrid;

} );