// Don't want to pollute Facebook namespace ;)

(function(){
var UIBlocks = DOM.scry( document.body,'.UIImageBlock_Entity' ),
		UIBlockLen = 0,
    finalUIBlock,
    dataKeys = ['Other Activity', 'Music and Videos', 'Comments and Likes', 'Games', 'Photos', 'Status Updates', 'Life Events', 'Only Important', 'Most Updates', 'All Updates'],
		inputSubscribeLevel = 'All Updates',
		inputWatchLevels = ['Life Events'],
		failedRows = [];

// Grabbed from http://github.com/Ensighten/CSS-Query/blob/master/src/cssQuery.js
var getDisplay = (function (win) {
	var gCS = win.getComputedStyle;
	return function (node) {
		// Initially supported any key, but due to browser wars and size-first changed to fixed
		var ret = '',
				style;
		// Skip over text nodes
		if( node.nodeType !== 3 ) {
			if(gCS) {
				// Second parameter is for pseudo element (we never use it but FF complains otherwise)
				style = gCS(node, null);
				ret = style.getPropertyValue('display');
			}
			else {
				style = node.currentStyle;
				if( style ) {
					// Reference for proper keys: http://msdn.microsoft.com/en-us/library/ms535231%28v=vs.85%29.aspx
					ret = style.display;
				}
			}
		}
		ret += '';
		return ret;
	};
}(window));

function init(subscribeLevel, watchLevels) {
	inputSubscribeLevel = subscribeLevel;
	inputWatchLevels = watchLevels;
	dataKeys = watchLevels.concat([subscribeLevel]);
	scrollFriendsAsync();
}

// Scroll through all profiles
function scrollFriendsAsync() {
	function callbackSelf() {
		setTimeout( scrollFriendsAsync, 1000 );
	}

	// Ensure that the remaining profiles are done loading
	var UIPageLoader = DOM.find(document.body, '.uiMorePagerLoader');
	if( UIPageLoader && getDisplay( UIPageLoader ) !== 'none' ) {
		callbackSelf();
		return;
	}

	// If condition is met, fire the callback and leave
	if( UIBlockLen === UIBlocks.length ) {
		autoSubscribeBody.innerHTML = 'Updating all subscriptions (your browser may freeze for a second)';
		setTimeout( setAllSubscriptions, 100 );
		return;
	}

	UIBlockLen = UIBlocks.length;
	UIBlocks = DOM.scry( document.body,'.UIImageBlock_Entity' );

	// Make sure the last element isn't hidden
	finalUIBlock = UIBlocks.pop();;
	while( Parent.byClass(finalUIBlock, 'hidden_elem') ) {
		finalUIBlock = UIBlocks.pop();
	}

	// Scroll to it
	DOMScroll.scrollTo( finalUIBlock );

	// Wait for profiles to load
	callbackSelf();
}

function setAllSubscriptions() {
	var UIBlocks = DOM.scry( document.body,'.UIImageBlock_Entity' ),
			UIBlockIndex,
			UIBlockLen;
	for( UIBlockIndex = 0, UIBlockLen = UIBlocks.length; UIBlockIndex < UIBlockLen; UIBlockIndex++ ) {
	// for( UIBlockIndex = 0, UIBlockLen = 1; UIBlockIndex < UIBlockLen; UIBlockIndex++ ) {
		UIBlock = UIBlocks[UIBlockIndex];
		rowIdentifier = 'Row ' + UIBlockIndex;

		try {
			var contentBlock = DOM.find(UIBlock, '.UIImageBlock_Content'),
					a = DOM.find(contentBlock, 'a'),
					profileId;

			rowIdentifier = a.innerHTML;
			profileId = a.getAttribute('data-hovercard').match(/\?id=(\d+)/)[1];

			SubscriptionFlyoutController.show(
				DOM.find(UIBlock, '.subscribeButtonsContainer')
			);

			var menuItems = document.getElementsByName('subscription_id'),
					i,
					dataObj = {};

			for( i = menuItems.length; i--; ) {
					menuItem = menuItems[i];
					menuHTML = menuItem.parentNode.innerHTML;
					for( j = dataKeys.length; j--; ) {
							dataKey = dataKeys[j];
							if( menuHTML.match(dataKey) ) {
									dataObj[dataKey] = menuItem.value;
							}
					}
			}

			var subscribeLevel = dataObj[ inputSubscribeLevel ];
			categories = [];
			for( i = 0, len = inputWatchLevels.length; i < len; i++ ) {
				categories.push( dataObj[ inputWatchLevels[i] ] );
			}

			var ajaxObj = {
					profile_id: profileId,
					level: subscribeLevel,
					custom_categories: categories,
					location: 3 // No idea what this means (I would guess URL)
			};
			new AsyncRequest().setURI('/ajax/follow/manage_subscriptions.php').setData(ajaxObj).send();

		} catch(e) {
			// TODO: Spit out errors
			failedRows.push( rowIdentifier );
		}
	}
	
	autoSubscribeBody.innerHTML = 'Waiting for changes to complete.';
	setTimeout( function () {
		autoSubscribeBody.innerHTML = 'Refreshing your browser.<br/>You should see changes once the page reloads.<br/>Thank you and have a nice day!';
		location.reload();
	}, 5000 );
}

// Build container
var d = document,
		c = 'createElement',
		autoSubscribeBox = d[c]('div');

function setStyle(node, css) {
	node.setAttribute('style', css);
}

// It's over 9000!!
setStyle( autoSubscribeBox, 'z-index: 9001; border: 1px solid #000; width: 300px; position: fixed; left: 40%; top: 10%; background: #FFF; outline: 2px solid #FFF; ' );

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

autoSubscribeDescription.innerHTML = "The settings below will set <strong>all</strong> of your friends to the same subscription format. Click 'Change All Subscriptions' once you are ready.";
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
	var i,
			len;

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

			// Localize categories
	var $categories = categories,
			category,
			inputCategories = [];

	for( i = 0, len = $categories.length; i < len; i++ ) {
		category = $categories[i];

		if( category.input.checked ) {
			inputCategories.push( category.value );
		}
	}

	autoSubscribeBody.innerHTML = 'Scrolling profiles...';
	init(inputUpdateLevel, inputCategories);
};

/** BEGIN PATCH FOR WRONG PAGE **/
var pageQueryString = location.search || '';
if( !pageQueryString.match(/sk=subscribedto/) || !pageQueryString.match(/filter=1/) ) {
	autoSubscribeBody.innerHTML = 'You are not on the correct page.<br/>Click the link below to go to the correct page.<br/>From there, reload this script.<br/><br/><a href="http://www.facebook.com/profile.php?sk=subscribedto&filter=1">http://www.facebook.com/profile.php?sk=subscribedto&filter=1</a>';
}

/** END PATCH FOR WRONG PAGE **/

// Focus on our element
autoSubscribeBox.scrollIntoView();

}());