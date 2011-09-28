(function(){
// Localize document and simplify element creation
var d = document,
		c = 'createElement',
		crElt = function (eltName) {
			return d[c](eltName);
		};

// Helper function for setting style on elements
function setStyle(node, css) {
	node.setAttribute('style', css);
}

// Helper function for setting for on elements
function setStyle(node, id) {
	node.setAttribute('for', id);
}

/** BEGIN CONTAINER SECTION **/
// Create container
var container = crElt('div');

// Make it a popup with style (It's over 9000!!)
setStyle( container, 'z-index: 9001; border: 1px solid #000; width: 300px; position: absolute; left: 40%; top: 10%; background: #FFF; outline: 2px solid #FFF; ' );
/** END CONTAINER SECTION **/

/** BEGIN HEADER SECTION **/
// Create header
var header = crElt('div');

// Add bottom border to header
setStyle( header, 'border-bottom: 1px solid #000; padding: .2em .3em;');

/** BEGIN SUBSECTION: HEADER CONTENT **/
// Create a title and close button
var headerTitle = d[c]('div'),
		closeButton = d[c]('div');

// Add style and fill in text for title
setStyle( headerTitle, 'display: inline' );
headerTitle.innerHTML = 'Auto Subscriber';

// Make closeButton pink with black border and fill it in with an 'x'
setStyle( closeButton, 'border: 1px solid #000; cursor: pointer; font-family: monospace; width: 1.1em; height: 1.2em; text-align: center; float: right; background: pink;' );
closeButton.innerHTML = 'x';

// Add title and close button to header
header.appendChild(headerTitle);
header.appendChild(closeButton);
/** END SUBSECTION: HEADER CONTENT **/

// Add header to container
container.appendChild(header);
/** END HEADER SECTION **/

/** BEGIN BODY SECTION **/
// Create "body" element
var body = crElt('div');

// Give some padding to the body
setStyle( body, 'padding: .2em .3em;');

/** BEGIN SUBSECTION: BODY DESCRIPTION **/
// Create description and line break
var bodyDescription = crElt('div'),
		br = crElt('br');

bodyDescription.innerHTML = "The settings below will set all of your current friend subscriptions to the same. Click 'Change All Subscriptions' once you are ready.";
body.appendChild(bodyDescription);
body.appendChild(br);
/** END SUBSECTION: BODY DESCRIPTION **/

// Update level fieldset
var autoSubscribeUpdateLevelFieldset = d[c]('fieldset'),
		autoSubscribeUpdateLevelLegend = d[c]('legend'),
		autoSubscribeUpdateLevelBr = d[c]('br'),
		autoSubscribeUpdateLevelDisableCheckbox = d[c]('input'),
		autoSubscribeUpdateLevelDisableLabel = d[c]('label'),
		// DRY is awesome
		updateLevels = [
			{ 'value': 'All Updates' },
			{ 'value': 'Most Updates',
				'checked': 1 },
			{	'value': 'Only Important' }
		],
		updateLevel,
		autoSubscribeUpdateLevelRow,
		autoSubscribeUpdateLevelInput,
		autoSubscribeUpdateLevelLabel,
		key,
		value,
		i,
		len;

autoSubscribeUpdateLevelLegend.innerHTML = 'How many updates?';
autoSubscribeUpdateLevelFieldset.appendChild(autoSubscribeUpdateLevelLegend);

// Generate disable row
autoSubscribeUpdateLevelRow = d[c]('div');
key = 'autoSubscribeUpdateLevelDisable';

autoSubscribeUpdateLevelDisableCheckbox.type = 'checkbox';
autoSubscribeUpdateLevelDisableCheckbox.id = key;
autoSubscribeUpdateLevelDisableCheckbox.name = key;

autoSubscribeUpdateLevelDisableLabel.setAttribute('for', key);
autoSubscribeUpdateLevelDisableLabel.innerHTML = 'Ignore this section';

// Append to fieldset
autoSubscribeUpdateLevelRow.appendChild(autoSubscribeUpdateLevelDisableCheckbox);
autoSubscribeUpdateLevelRow.appendChild(autoSubscribeUpdateLevelDisableLabel);
autoSubscribeUpdateLevelFieldset.appendChild(autoSubscribeUpdateLevelRow);
autoSubscribeUpdateLevelFieldset.appendChild(autoSubscribeUpdateLevelBr);
autoSubscribeUpdateLevelBr = d[c]('br');

// Iterate the updateLevels and append to fieldset
for( i = 0, len = updateLevels.length; i < len; i++ ) {
	updateLevel = updateLevels[i];
	key = 'autoSubscribeUpdateLevel' + i;
	value = updateLevel.value;

	autoSubscribeUpdateLevelRow = d[c]('div');

	autoSubscribeUpdateLevelInput = d[c]('input');
	autoSubscribeUpdateLevelInput.type = 'radio';
	autoSubscribeUpdateLevelInput.id = key;
	autoSubscribeUpdateLevelInput.name = 'autoSubscribeUpdateLevel';
	if( updateLevel.checked ) {
		autoSubscribeUpdateLevelInput.checked = 'checked';
	}
	autoSubscribeUpdateLevelInput.value = value;

	autoSubscribeUpdateLevelLabel = d[c]('label');
	autoSubscribeUpdateLevelLabel.setAttribute('for', key);
	autoSubscribeUpdateLevelLabel.innerHTML = value;

	autoSubscribeUpdateLevelRow.appendChild(autoSubscribeUpdateLevelInput);
	autoSubscribeUpdateLevelRow.appendChild(autoSubscribeUpdateLevelLabel);
	autoSubscribeUpdateLevelFieldset.appendChild(autoSubscribeUpdateLevelRow);

	// Save inputs for later (Mmmm, memory leak)
	updateLevel.input = autoSubscribeUpdateLevelInput;
}

body.appendChild(autoSubscribeUpdateLevelFieldset);
body.appendChild(autoSubscribeUpdateLevelBr);

// Category fieldset
var autoSubscribeCategoryFieldset = d[c]('fieldset'),
		autoSubscribeCategoryLegend = d[c]('legend'),
		autoSubscribeCategoryBr = d[c]('br'),
		autoSubscribeCategorySpan = d[c]('span'),
		// DRY is awesome
		categories = [
			{
				'value': 'Life Events',
				'state': 1
			}, {
				'value': 'Status Updates',
				'state': 1
			}, {
				'value': 'Photos',
				'state': 1
			}, {
				'value': 'Games',
				'state': 1
			}, {
				'value': 'Comments and Likes',
				'state': 1
			}, {
				'value': 'Music and Videos',
				'state': 1
			}, {
				'value': 'Other Activity',
				'state': 1
			}],
		category,
		autoSubscribeCategoryRow,
		autoSubscribeCategoryInput,
		autoSubscribeCategoryLabel,
		inputFn;

autoSubscribeCategoryLegend.innerHTML = 'What types of updates?';
autoSubscribeCategoryFieldset.appendChild(autoSubscribeCategoryLegend);

autoSubscribeCategorySpan.innerHTML = '&nbsp;// <b>Rem</b> = \'Remove from feed\';<br/>&nbsp;// <b>DoC</b> = \'Don\'t Change\'; <b>Add</b> = \'Add to feed\';';
autoSubscribeCategoryFieldset.appendChild(autoSubscribeCategorySpan);

// Same as before
for( i = 0, len = categories.length; i < len; i++ ) {
	category = categories[i];
	key = 'autoSubscribeCategory' + i;
	value = category.value;

	autoSubscribeCategoryRow = d[c]('div');

	autoSubscribeCategoryInput = d[c]('input');
	autoSubscribeCategoryInput.type = 'checkbox';
	autoSubscribeCategoryInput.id = key;
	autoSubscribeCategoryInput.name = key;
	autoSubscribeCategoryInput.value = value;

	autoSubscribeCategoryLabel = d[c]('label');
	setStyle( autoSubscribeCategoryLabel, 'font-weight: normal;' );
	autoSubscribeCategoryLabel.setAttribute('for', key);

	autoSubscribeCategoryRow.appendChild(autoSubscribeCategoryInput);
	autoSubscribeCategoryRow.appendChild(autoSubscribeCategoryLabel);
	autoSubscribeCategoryFieldset.appendChild(autoSubscribeCategoryRow);


	// Save inputs for later (Mmmm, memory leak)
	category.input = autoSubscribeCategoryInput;
	category.label = autoSubscribeCategoryLabel;

	// Bind closured onclick
	alterState = (function(category){
			var state = category.state;

			// Change to the new state
			state += 1;

			// I could do modular logic, but this is much easier to adjust/consume
			if( state === 2 ) {
				state = -1;
			}

			// Save altered state
			category.state = state;
	}(category));



	styleButton = (function(category){
		return function () {
			var input = category.input,
					label = category.label,
					labelHTML = '(Rem/DoC/Add) ' + category.value,
					labelReplaceFn = function(text, index) { return '<b>' + text + '</b>' },
					state = category.state;

			input.indeterminate = false;
			input.checked = false;

			// -1 will be remove item from feed
			if( state === -1 ) {
				label.innerHTML = labelHTML.replace('Rem', labelReplaceFn);
			// 0 will be don't change
			} else if ( state === 0 ) {
				label.innerHTML = labelHTML.replace('DoC', labelReplaceFn);
				input.indeterminate = true;
			// 1 will be add item to feed
			} else {
				label.innerHTML = labelHTML.replace('Add', labelReplaceFn);
				input.checked = true;
			}
		};
	}(category));

	autoSubscribeCategoryInput.onclick = function () { alterState(); styleButton() };

	// Save for later
	category.styleButton = styleButton;

	// Activate now to invoke proper state
	styleButton();
}

body.appendChild(autoSubscribeCategoryFieldset);
body.appendChild(autoSubscribeCategoryBr);

// Submit button
var autoSubscribeSubmitContainer = d[c]('div'),
		autoSubscribeSubmitButton = d[c]('input');
autoSubscribeSubmitButton.type = 'button';
autoSubscribeSubmitButton.value = 'Change All Subscriptions';
setStyle( autoSubscribeSubmitContainer, 'text-align: right;' );
setStyle( autoSubscribeSubmitButton, 'cursor: pointer;' );
autoSubscribeSubmitContainer.appendChild(autoSubscribeSubmitButton);
body.appendChild(autoSubscribeSubmitContainer);

container.appendChild(body);
/** END BODY SECTION **/

/** BEGIN DOM LOGIC SECTION **/
// Attach container to the body
d.body.appendChild(container);

// Hook in events for close button and 'Change All Subscriptions'
closeButton.onclick = function () {
	d.body.removeChild(container);
};

autoSubscribeSubmitButton.onclick = function () { // TODO: Collect info from disables
	var i,
			len,
			// Localize categories
			$categories = categories,
			category,
			inputCategories = [];

	for( i = 0, len = $categories.length; i < len; i++ ) {
		category = $categories[i];

		if( category.input.checked ) {
			inputCategories.push( category.value );
		}
	}

	var $updateLevels = updateLevels,
			updateLevel,
			inputUpdateLevel = '';

	for( i = 0, len = $updateLevels.length; i < len; i++ ) {
		updateLevel = $updateLevels[i];

		if( updateLevel.input.checked ) {
			inputUpdateLevel = updateLevel.value;
			break;
		}
	}

	console.log( inputUpdateLevel, inputCategories );
};

// TODO: Bind disable handling for 'ignore this section'
// TODO: Add checkbox for 'skip unsubscribed friends' but build to handle any callback fn
// TODO: Separate each friend into data object, then push onto massive array
// TODO: Add 'ignore this section' (make it look like a link) into legend instead of as a checkbox
// TODO: Move function binding for Rem/DoC/Add down here?
// TODO: Add in Rem All, DoC All, Add All buttons and bindings