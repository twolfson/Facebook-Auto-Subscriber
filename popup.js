(function(d){
// Localize document and simplify element creation
var c = 'createElement',
		// Helper function for creating a element
		crElt = function (eltName) {
			return d[c](eltName);
		},
		// Helper function for HTML structuring
		bindNewElt = function (container, eltName) {
			var elt = crElt(eltName);
			container.appendChild(elt);
			return elt;
		};

// Helper function for setting style on elements
function setStyle(node, css) {
	node.setAttribute('style', css);
}

// Helper function for setting attributes on elements
function setAttributes( node, attrObj ) {
	var key;
	for( key in attrObj ) {
		if( attrObj.hasOwnProperty(key) ) {
			node.setAttribute(key, attrObj[key]);
		}
	}
}

// Helper function to run and return a function
function exec(fn) {
	fn();
	return fn;
}

/** BEGIN DRY PREP DATA **/
var i,
		len,
		levelFieldsetObj =
			{ 'state': 1 }, // TODO: Add toggleElts array here, hook in fieldsetRows during creation, use display: none (easier than removing, rebinding) during hiding
		levelObjArr = [
			{ 'value': 'All Updates' },
			{ 'value': 'Most Updates',
				'checked': 1 },
			{	'value': 'Only Important' }
		],
		levelObj,
		input,
		label,
		key,
		val,
		categoryFieldsetObj =
			{ 'state': 1 },
		categoryObjArr = [
			{	'value': 'Life Events',
				'state': 1 },
			{	'value': 'Status Updates',
				'state': 1	},
			{	'value': 'Photos',
				'state': 1	},
			{	'value': 'Games',
				'state': 1	},
			{	'value': 'Comments and Likes',
				'state': 1	},
			{	'value': 'Music and Videos',
				'state': 1	},
			{	'value': 'Other Activity',
				'state': 1	}
		],
		categoryObj;
/** END DRY PREP DATA **/

/** BEGIN GENERATE HTML FOR CONTAINER **/
var container = crElt('div'),
			header = bindNewElt(container, 'div'),
				headerTitle = bindNewElt(header, 'div'),
				closeButton = bindNewElt(header, 'div'),
			body = bindNewElt(container, 'div'),
				// Description
				bodyDescription = bindNewElt(body, 'div'),
				bodyDescriptionBr = bindNewElt(body, 'br'),
				// Level fieldset
				levelFieldset = bindNewElt(body, 'fieldset');
				levelFieldsetObj.fieldset = levelFieldset;
var				levelLegend = bindNewElt(levelFieldset, 'legend'),
						levelLegendSpanPreU = bindNewElt(levelLegend, 'span');
						levelFieldsetObj.u = bindNewElt(levelLegend, 'u');
						levelLegendSpanPostU = bindNewElt(levelLegend, 'span');
var				levelFieldRow;
					for( i = 0, len = levelObjArr.length; i < len; i++ ) {
						levelObj = levelObjArr[i];
						levelFieldRow = bindNewElt(levelFieldset, 'div');
						// Save inputs for later (Mmmm, memory leak)
						levelObj.input = bindNewElt(levelFieldRow, 'input');
						levelObj.label = bindNewElt(levelFieldRow, 'label');
					}
				// Category fieldset
var     categoryFieldset = bindNewElt(body, 'fieldset');
				categoryFieldsetObj.fieldset = categoryFieldset;
var				categoryLegend = bindNewElt(categoryFieldset, 'legend'),
						categoryLegendSpanPreU = bindNewElt(categoryLegend, 'span');
						categoryFieldsetObj.u = bindNewElt(categoryLegend, 'u');
						categoryLegendSpanPostU = bindNewElt(categoryLegend, 'span');
var				categorySpan = bindNewElt(categoryFieldset, 'span'),
					categoryFieldRow;
					for( i = 0, len = categoryObjArr.length; i < len; i++ ) {
						categoryObj = categoryObjArr[i];
						categoryFieldRow = bindNewElt(categoryFieldset, 'div');
						categoryObj.input = bindNewElt(categoryFieldRow, 'input');
						categoryObj.label = bindNewElt(categoryFieldRow, 'label');
					}
					// TODO: Add in Add All/ DoC All / Rem All buttons
				// TODO: Skip unsubscribed friends
				// Submit Container
var			submitContainer = bindNewElt(body, 'div'),
					submitButton = bindNewElt(submitContainer, 'input');
/** END GENERATE HTML FOR CONTAINER **/

/** BEGIN FILL IN CONTENT **/
// Header
	headerTitle.innerHTML = 'Auto Subscriber';
	closeButton.innerHTML = 'x';
// Body
	// Body description
	bodyDescription.innerHTML = "The settings below will set all of your current friend subscriptions to the same. Click 'Change All Subscriptions' once you are ready.";
	// Level fieldset
		function getFieldsetHtmlFn(fieldsetObj) {
			return function () {
				var state = fieldsetObj.state,
						html = 'Use/Ignore this section',
						u = fieldsetObj.u,
						uReplaceFn = function (text, index) { return '<b>' + text + '</b>'; };

				if( state ) {
					u.innerHTML = html.replace('Use', uReplaceFn );
				} else {
					u.innerHTML = html.replace('Ignore', uReplaceFn );
				}
			}
		}

		levelLegendSpanPreU.innerHTML = 'How many updates? (';
		levelLegendSpanPostU.innerHTML = ')';
		levelFieldsetObj.htmlFn = exec( getFieldsetHtmlFn(levelFieldsetObj) );

		for( i = 0, len = levelObjArr.length; i < len; i++ ) {
			levelObj = levelObjArr[i];
			levelObj.input.type = 'radio';
			levelObj.label.innerHTML = levelObj.value;
		}

	// Category fieldset
		categoryLegendSpanPreU.innerHTML = 'What types of updates? (';
		categoryLegendSpanPostU.innerHTML = ')';
		categoryFieldsetObj.htmlFn = exec( getFieldsetHtmlFn(categoryFieldsetObj) );
		categorySpan.innerHTML = '&nbsp;// <b>Rem</b> = \'Remove from feed\';<br/>&nbsp;// <b>DoC</b> = \'Don\'t Change\'; <b>Add</b> = \'Add to feed\';';

		function getCategoryHTMLFn(categoryObj) {
			var labelHTML = '(Rem/DoC/Add) ' + categoryObj.value;
			return function () {
				var label = categoryObj.label,
						labelReplaceFn = function (text, index) { return '<b>' + text + '</b>'; },
						state = categoryObj.state;

				// -1 will be remove item from feed
				if( state === -1 ) {
					label.innerHTML = labelHTML.replace('Rem', labelReplaceFn);
				// 0 will be don't change
				} else if ( state === 0 ) {
					label.innerHTML = labelHTML.replace('DoC', labelReplaceFn);
				// 1 will be add item to feed
				} else {
					label.innerHTML = labelHTML.replace('Add', labelReplaceFn);
				}
			};
		}

		for( i = 0, len = categoryObjArr.length; i < len; i++ ) {
			categoryObj = categoryObjArr[i];
			categoryObj.input.type = 'checkbox';
			categoryObj.htmlFn = exec( getCategoryHTMLFn(categoryObj) );
		}
	// Submit container
		submitButton.type = 'button';
		submitButton.value = 'Change All Subscriptions';

/** END FILL IN CONTENT **/

/** BEGIN STYLING CONTAINER **/
// Make it a popup with style (It's over 9000!!)
setStyle( container, 'z-index: 9001; border: 1px solid #000; width: 300px; position: absolute; left: 40%; top: 10%; background: #FFF; outline: 2px solid #FFF;' );

// Header
var paddingContainerChildren = 'padding: .2em .3em;';
setStyle( header, 'border-bottom: 1px solid #000; ' + paddingContainerChildren);
	setStyle( headerTitle, 'display: inline' );
	setStyle( closeButton, 'border: 1px solid #000; cursor: pointer; font-family: monospace; width: 1.1em; height: 1.2em; text-align: center; float: right; background: pink;' );
// Body
setStyle( body, paddingContainerChildren);
	// Level fieldset
	function getFieldsetStyleFn(fieldsetObj) {
		setStyle( fieldsetObj.u, 'cursor: pointer' );
		return function () {
			// TODO: Figure out hiding/not hiding
		}
	}
	levelFieldsetObj.styleFn = exec( getFieldsetStyleFn(levelFieldsetObj) );
		// Radio buttons
		for( i = 0, len = levelObjArr.length; i < len; i++ ) {
			levelObj = levelObjArr[i];
			levelObj.input.checked = levelObj.checked;
		}
	// Category fieldset
	categoryFieldsetObj.styleFn = exec( getFieldsetStyleFn(categoryFieldsetObj) );
		// Checkboxes
		function getCategoryStyleFn(categoryObj) {
			return function () {
				var input = categoryObj.input,
						state = categoryObj.state;

				// 0 will be don't change (indeterminate)
				if( state === 0 ) {
					input.indeterminate = true;
					input.checked = false;
				} else {
					// -1 will be remove item from feed (unchecked)
					// 1 will be add item to feed (checked)
					input.indeterminate = false;
					input.checked = (state === 1);
				}
			};
		}
		for( i = 0, len = categoryObjArr.length; i < len; i++ ) {
			categoryObj = categoryObjArr[i];
			categoryObj.input.type = 'checkbox';
			setStyle( categoryObj.label, 'font-weight: normal;' );
			categoryObj.styleFn = exec( getCategoryStyleFn(categoryObj) );
		}
	// Submit container
	setStyle( submitContainer, 'text-align: right;' );
		setStyle( submitButton, 'cursor: pointer;' );
/** END STYLING CONTAINER **/

/** BEGIN FUNCTIONALITY BINDING **/
// Header
	closeButton.onclick = function () {
		d.body.removeChild(container);
	};
// Body
	// Level fieldset
		// Legend
		function getFieldsetOnclick(fieldsetObj) {
			var htmlFn = fieldsetObj.htmlFn,
			    styleFn = fieldsetObj.styleFn,
					htmlStyleFn = function () {
						htmlFn();
						styleFn();
					};

			return function () {
				fieldsetObj.state ^= 1;
				htmlStyleFn();
			};
		}
		levelFieldsetObj.u.onclick = getFieldsetOnclick(levelFieldsetObj);
		// Radio buttons
		for( i = 0, len = levelObjArr.length; i < len; i++ ) {
			levelObj = levelObjArr[i];

			// Set up a common key so clicks on label can bind to input
			key = 'autoSubscribeUpdateLevel' + i;

			setAttributes( levelObj.input, {
					'id': key,
					'name': 'autoSubscribeUpdateLevel',
					'value': levelObj.value
				});

			levelObj.label.setAttribute('for', key);
		}
	// Category fieldset
		// Legend
		categoryFieldsetObj.u.onclick = getFieldsetOnclick(categoryFieldsetObj);
		// Checkboxes
		// State function for checkboxes
		function getCategoryOnclick(categoryObj) {
			var htmlFn = categoryObj.htmlFn,
					styleFn = categoryObj.styleFn,
					htmlStyleFn = function () {
						htmlFn();
						styleFn();
					};
			return function() {
				// Get and adjust to new state
				var state = categoryObj.state + 1;

				// If state is 2, set to -1 (this could be modular logic but I won't)
				if( state === 2 ) {
					state = -1;
				}

				// Save altered state
				categoryObj.state = state;

				// Change HTML and style object
				htmlStyleFn();
			};
		}

		// Binding portion
		for( i = 0, len = categoryObjArr.length; i < len; i++ ) {
			categoryObj = categoryObjArr[i];
			key = 'autoSubscribeCategory' + i;
			val = categoryObj.value;
			input = categoryObj.input;

			// Browser-level fuctionality
			setAttributes( input, {
				'id': key,
				'name': key,
				'value': val } );
			categoryObj.label.setAttribute('for', key);

			// DOM Level 0 functionality
			input.onclick = getCategoryOnclick(categoryObj);
		}

	// Submit container
		function getLevel(levelObjArr) {
			var i,
					len,
					levelObj,
					inputLevel = '';

			for( i = 0, len = levelObjArr.length; i < len; i++ ) {
				levelObj = levelObjArr[i];

				if( levelObj.input.checked ) {
					inputLevel = levelObj.value;
					break;
				}
			}

			return inputLevel;
		}

		function getCategories(categoryObjArr) {
			var	i,
					len,
					categoryObj,
					inputCategories = [];

			for( i = 0, len = categoryObjArr.length; i < len; i++ ) {
				categoryObj = categoryObjArr[i];

				if( categoryObj.input.checked ) {
					// Performance boost (Zakas)
					// Use your boost to get through!
					inputCategories[inputCategories.length] = categoryObj.value;
				}
			}

			return inputCategories;
		}

		submitButton.onclick = function () { // TODO: Collect info from disables
			var inputLevel = getLevel(levelObjArr),
					inputCategories = getCategories(categoryObjArr);

			console.log( inputLevel, inputCategories );
		};
/** END FUNCTIONALITY BINDING **/

// Expose container to the world
d.body.appendChild(container);

// TODO: Bind disable handling for 'ignore this section'
// TODO: Add checkbox for 'skip unsubscribed friends' but build to handle any callback fn
// TODO: Separate each friend into data object, then push onto massive array
// TODO: Add 'ignore this section' (make it look like a link) into legend instead of as a checkbox
// TODO: Move function binding for Rem/DoC/Add down here?

// TODO: Add in Rem All, DoC All, Add All buttons and bindings
}(document));