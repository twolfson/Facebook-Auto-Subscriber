// Build container
var d = document,
		c = 'createElement',
		autoSubscribeBox = d[c]('div');

function setStyle(node, css) {
	node.setAttribute('style', css);
}

// It's over 9000!!
setStyle( autoSubscribeBox, 'z-index: 9001; border: 1px solid #000; width: 300px; position: absolute; left: 40%; top: 10%; background: #FFF; outline: 2px solid #FFF; ' );

// Build and append second level
var autoSubscribeHeader = d[c]('div'),
		autoSubscribeBody = d[c]('div');
setStyle( autoSubscribeHeader, 'border-bottom: 1px solid #000; padding: .2em .3em;');
setStyle( autoSubscribeBody, 'padding: .2em .3em;');
autoSubscribeBox.appendChild(autoSubscribeHeader);
autoSubscribeBox.appendChild(autoSubscribeBody);

// Fill in header
var autoSubscribeHeaderText = d[c]('div'),
		autoSubscribeCloseButton = d[c]('div');
setStyle( autoSubscribeHeaderText, 'display: inline' );
autoSubscribeHeaderText.innerHTML = 'Auto Subscriber';
setStyle( autoSubscribeCloseButton, 'border: 1px solid #000; cursor: pointer; font-family: monospace; width: 1.1em; height: 1.2em; text-align: center; float: right; background: pink;' );
autoSubscribeCloseButton.innerHTML = 'x';
autoSubscribeHeader.appendChild(autoSubscribeHeaderText);
autoSubscribeHeader.appendChild(autoSubscribeCloseButton);

// Body description
var autoSubscribeDescription = d[c]('div'),
		autoSubscribeDescriptionBr = d[c]('br');
autoSubscribeDescription.innerHTML = "The settings below will set all of your current friend subscriptions to the same. Click 'Change All Subscriptions' once you are ready.";
autoSubscribeBody.appendChild(autoSubscribeDescription);
autoSubscribeBody.appendChild(autoSubscribeDescriptionBr);

// Update level fieldset
var autoSubscribeUpdateLevelFieldset = d[c]('fieldset'),
		autoSubscribeUpdateLevelLegend = d[c]('legend'),
		autoSubscribeUpdateLevelBr = d[c]('br'),
		// DRY is awesome
		updateLevels = [
			{
				'value': 'All Updates',
			}, {
				'value': 'Most Updates',
				'checked': 1
			}, {
				'value': 'Only Important'
			}],
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

autoSubscribeBody.appendChild(autoSubscribeUpdateLevelFieldset);
autoSubscribeBody.appendChild(autoSubscribeUpdateLevelBr);

// Category fieldset
var autoSubscribeCategoryFieldset = d[c]('fieldset'),
		autoSubscribeCategoryLegend = d[c]('legend'),
		autoSubscribeCategoryBr = d[c]('br'),
		// DRY is awesome
		categories = [
			{
				'value': 'Life Events',
				'checked': 1
			}, {
				'value': 'Status Updates',
				'checked': 1
			}, {
				'value': 'Photos',
				'checked': 1
			}, {
				'value': 'Games',
				'checked': 1
			}, {
				'value': 'Comments and Likes',
				'checked': 1
			}, {
				'value': 'Music and Videos',
				'checked': 1
			}, {
				'value': 'Other Activity',
				'checked': 1
			}],
		category,
		autoSubscribeCategoryRow,
		autoSubscribeCategoryInput,
		autoSubscribeCategoryLabel;

autoSubscribeCategoryLegend.innerHTML = 'What types of updates?';
autoSubscribeCategoryFieldset.appendChild(autoSubscribeCategoryLegend);

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
	if( category.checked ) {
		autoSubscribeCategoryInput.checked = 'checked';
	}
	autoSubscribeCategoryInput.value = value;
	
	autoSubscribeCategoryLabel = d[c]('label');
	autoSubscribeCategoryLabel.setAttribute('for', key);
	autoSubscribeCategoryLabel.innerHTML = value;
	
	autoSubscribeCategoryRow.appendChild(autoSubscribeCategoryInput);
	autoSubscribeCategoryRow.appendChild(autoSubscribeCategoryLabel);
	autoSubscribeCategoryFieldset.appendChild(autoSubscribeCategoryRow);
	
	// Save inputs for later (Mmmm, memory leak)
	category.input = autoSubscribeCategoryInput;
}

autoSubscribeBody.appendChild(autoSubscribeCategoryFieldset);
autoSubscribeBody.appendChild(autoSubscribeCategoryBr);

// Submit button
var autoSubscribeSubmitContainer = d[c]('div'),
		autoSubscribeSubmitButton = d[c]('input');
autoSubscribeSubmitButton.type = 'button';
autoSubscribeSubmitButton.value = 'Change All Subscriptions';
setStyle( autoSubscribeSubmitContainer, 'text-align: right;' );
setStyle( autoSubscribeSubmitButton, 'cursor: pointer;' );
autoSubscribeSubmitContainer.appendChild(autoSubscribeSubmitButton);
autoSubscribeBody.appendChild(autoSubscribeSubmitContainer);

d.body.appendChild(autoSubscribeBox);

// Hook in events for close button and 'Change All Subscriptions'
autoSubscribeCloseButton.onclick = function () {
	d.body.removeChild(autoSubscribeBox);
};

autoSubscribeSubmitButton.onclick = function () {
	console.log('Here we go!');
};