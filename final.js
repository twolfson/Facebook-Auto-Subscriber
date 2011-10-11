// Don't want to pollute Facebook namespace ;)
(function(d){
/** BEGIN: SUBSCRIBER.JS **/

var failedRows = [],
		noop = function(){};

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

// Helper function for passing functions
function regenFn(fn, aArgs) {
	var args = [].concat.apply([], aArgs);
	return function () {
		fn.apply(this, args);
	};
}

// Function to scroll through all profiles (asynchronously) ;)
var scrollFriendsAsync = (function(){
// Set up privatized variables
var UIBlocks = [],
		UIBlockLen = -1,
    finalUIBlock,
		body = document.body;

return function (callback) {
	var args = arguments;

	// Set up callback function for self
	function callbackSelf() {
		setTimeout( regenFn(scrollFriendsAsync, args), 1000 );
	}

	// Ensure that the remaining profiles are done loading
	var UIPageLoader = DOM.find(body, '.uiMorePagerLoader');
	if( UIPageLoader && getDisplay( UIPageLoader ) !== 'none' ) {
		callbackSelf();
		return;
	}

	// If condition is met, fire the callback and leave
	if( UIBlockLen === UIBlocks.length ) {
		// Fallback in case no callback is supplied
		callback = callback || noop;
		callback();
		return;
	}

	// Save the new length and grab all the blocks once more
	UIBlockLen = UIBlocks.length;
	UIBlocks = DOM.scry( document.body,'.UIImageBlock_Entity' );

	// Make sure the last element isn't hidden
	do {
		finalUIBlock = UIBlocks.pop();
	} while( finalUIBlock && getDisplay( finalUIBlock ) === 'none' );

	// Scroll to the last non-hidden element
	// We could use finalUIBlock.scrollIntoView (native JS) but this is so much prettier; thanks Facebook!
	DOMScroll.scrollTo( finalUIBlock );

	// Wait for new profiles to load
	callbackSelf();
};

}());

// Async scraper
function grabAllSubscriptions(fns) {
	var body = document.body,
			UIBlocks = DOM.scry( body, '.UIImageBlock_Entity' ),
			UIBlock,
			UIBlockIndex = 0,
			UIBlockLen = UIBlocks.length,
			profiles = [],
			rowIdentifier,
			checkedRegex = /(^|\s)\s*checked\s*(\s|$)/,
			eachFn = fns.eachFn || noop,
			callback = fns.callback || noop;

	function scrapeProfiles() {
		var UIBlockCounter = 1,
				profile;

		for( ; UIBlockCounter--; UIBlockIndex++ ) {
			// If we have gone through all the blocks, callback
			if( UIBlockIndex >= UIBlockLen ) {
				// Spit out errors
				if( failedRows.length > 0 ) {
					alert( 'Errors occurred with:\n' + failedRows.join('\n') );
				}

				// Callback with profiles
				callback = callback || noop;
				callback(profiles);
				return;
			}

			// Grab current block
			UIBlock = UIBlocks[UIBlockIndex];
			rowIdentifier = 'Row ' + UIBlockIndex;

			try {
				eachFn(UIBlockIndex, UIBlock);

				var contentBlock = DOM.find(UIBlock, '.UIImageBlock_Content'),
						a = DOM.find(contentBlock, 'a'),
						profileId = a.getAttribute('data-hovercard').match(/\?id=(\d+)/)[1];

				// TODO: Make .find's and such more defensive

				rowIdentifier = a.innerHTML;

				// Grab subscribed status and profile id
				profile = {
					'subscribed': !DOM.find(UIBlock, '.subscribedButton').className.match(/hidden_elem/),
					'id': profileId };

				// Show the profile options
				SubscriptionFlyoutController.show(
					DOM.find(UIBlock, '.subscribeButtonsContainer')
				);

				// Generate checks (this is a slow DOM touch/repaint trigger; I would love to speed it up)
				var content = DOM.scry(document.body, '.FlyoutSubscriptionMenu').pop();
				EditSubscriptions.init(content, profileId, 3);

				// Grab the menu items
				var menuItems = DOM.scry(body, '.SubscriptionMenuItem'),
						menuItem,
						menuText,
						i;

				// Get values of each item
				for( i = menuItems.length; i--; ) {
					menuItem = menuItems[i];

					// Skip the hidden overlays
					if( Parent.byClass(menuItem, 'hidden_elem') ) {
						continue;
					}

					menuText = DOM.getText(menuItem);

					// Store item to profile
					profile[menuText] = {
						'chk': !!menuItem.className.match(checkedRegex),
						'val': DOM.find(menuItem, 'input').value
					};
				}

				// Add to return array
				profiles.push(profile);
			} catch(e) {
				// Push to error stack
				failedRows.push( rowIdentifier );
			}
		}

		// Async do-again in 20ms
		setTimeout(scrapeProfiles, 20);
	}

	// Begin more async
	scrapeProfiles();
}

/**
 * @param {Object} inputs Container object for inputs
 * @param {String} inputs.subscribeLevel Subscription level (All Updates, Most Updates, Only Important)
 * @param {Object} inputs.categories Levels to watch (Keys: Comments and Likes, Games, Life Events, Music and Videos, Other Activity, Photos, Status Updates)
 * @param {Boolean} inputs.categories.key If true, check item. If false, uncheck item. If never specified, use default.
 * @param {Object} [options] Options object
 * @param {Boolean} [skipUnsubscribed] Skip all unsubscribed persons
 * @param {Boolean} [unsubscribeAll] Unsubscribe all of your friends // TODO: Build into special alt popup
 * @param {Integer} [concurrentRequests] Amount of XHR to run at the same time. This will fallback to 8.
 */
function setAllSubscriptionsGenerator(inputs, options) {
// Fallback for options
inputs = inputs || { 'categories': {} };
options = options || {};

// Localize inputs
var inputSubscribeLevel = inputs.subscribeLevel || '',
    inputCategories = inputs.categories || {},
// Localize options
    skipUnsubscribed = options.skipUnsubscribed,
    unsubscribeAll = options.unsubscribeAll,
    concurrentRequests = options.concurrentRequests || 8,
// Set up constants
		possibleSubscribeLevels = ['All Updates', 'Most Updates', 'Only Important'],
		possibleSubscribeLevel,
		possibleCategories = ['Comments and Likes', 'Games', 'Life Events', 'Music and Videos', 'Other Activity', 'Photos', 'Status Updates'],
		possibleCategory;

var setAllSubscriptions = function (profiles, callback) {
		// TODO: Relocalize all options

		// Personal choice to reverse profiles (top down is preferred)
		profiles.reverse();

		// TODO: Abstract eachFn
		var profileIndex = 0,
				profileLen = profiles.length;

		function fireNextReq() {
			var profile = profiles.pop(),
					profileSubscribeLevel,
					categories = [],
					category,
					i,
					xhrData;

			if( !profile ) {
				callback = callback || noop;
				callback();

				// Overwrite to prevent multiple calls
				callback = noop;
				return;
			}
			
			// TODO: Abstract eachFn
			profileIndex += 1;
			updateStatus('Updating subscriptions (' + profileIndex + '/' + profileLen + ')');

			// TODO: Build out unsubscribeAll
			// {location: 13, profile_id} url: /ajax/follow/unfollow_profile.php

			// Skip if profile should be skipped
			if( skipUnsubscribed && !profile.subscribed ) {
				fireNextReq();
				retrun;
			}

			// Use the given subscribe level
			possibleSubscribeLevel = profile[inputSubscribeLevel];

			// If there is none, find the current one for this profile
			if( !possibleSubscribeLevel ) {
				// Iterate possible values
				for( i = possibleSubscribeLevels.length; i--; ) {
					// Localize posible value
					possibleSubscribeLevel = profile[ possibleSubscribeLevels[i] ];

					// If it is set, use it
					if( possibleSubscribeLevel.chk ) {
						break;
					}
				}
			}
			// Use the subscribe level
			subscribeLevel = possibleSubscribeLevel.val;

			// Check each category
			for( i = possibleCategories.length; i--; ) {
				possibleCategory = possibleCategories[i];

				// If user-specified, use what they chose
				if( inputCategories.hasOwnProperty(possibleCategory) ) {
					// Use it if true
					if( inputCategories[possibleCategory] ) {
						categories.push( profile[possibleCategory].val );
					}
				// Otherwise, use the current value
				} else {
					// Localize object
					category = profile[possibleCategory];
					// If checked, use it
					if( category.chk ) {
						categories.push( category.val );
					}
				}
			}

			var xhrData = {
						profile_id: profile.id,
						level: subscribeLevel,
						custom_categories: categories,
						location: 3 // No idea what this means (I would guess URL)
					},
					xhr = new AsyncRequest('/ajax/follow/manage_subscriptions.php');

			xhr.setData(xhrData);
			// Send next request
			xhr.finallyHandler = fireNextReq;
			xhr.send();
		}

		var i = concurrentRequests;
		for( ; i--; ) {
			fireNextReq();
		}
};

return setAllSubscriptions;
}

function updateStatus(msg) {
	body.innerHTML = msg;
	// console.log(msg);
}

/** END: SUBSCRIBER.JS **/
/** BEGIN: POPUP.JS **/

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

// Helper function for stopping normal event behavior
function preventNormal(e) {
	e = e || window.event;

	e.cancelBubble = true;
	if( e.preventDefault ) {
		e.preventDefault();
	}
	if( e.stopPropagation ) {
		e.stopPropagation();
	}
}

/** BEGIN DRY PREP DATA **/
var i,
		len,
		levelFieldsetObj =
			{ 'state': 1 },
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
		categoryFieldsetObj =	{ 'state': 1 },
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
			{	'value': 'Other Activity',
				'state': 1	},
			{	'value': 'Music and Videos',
				'state': 1	}
		],
		categoryObj,
		optionsSkipUnsubscribedObj = {};
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
				levelFieldset = bindNewElt(body, 'fieldset'),
   				levelLegend = bindNewElt(levelFieldset, 'legend'),
						levelLegendSpanPreU = bindNewElt(levelLegend, 'span');
						levelFieldsetObj.u = bindNewElt(levelLegend, 'u');
var					levelLegendSpanPostU = bindNewElt(levelLegend, 'span'),
   				levelFieldRow,
					levelToggleDiv = bindNewElt(levelFieldset, 'div');
					levelFieldsetObj.toggleDiv = levelToggleDiv;
					for( i = 0, len = levelObjArr.length; i < len; i++ ) {
						levelObj = levelObjArr[i];
						levelFieldRow = bindNewElt(levelToggleDiv, 'div');
						// Save inputs for later (Mmmm, memory leak)
						levelObj.input = bindNewElt(levelToggleDiv, 'input');
						levelObj.label = bindNewElt(levelToggleDiv, 'label');
					}
				// Category fieldset
var     categoryFieldset = bindNewElt(body, 'fieldset'),
   				categoryLegend = bindNewElt(categoryFieldset, 'legend'),
						categoryLegendSpanPreU = bindNewElt(categoryLegend, 'span');
						categoryFieldsetObj.u = bindNewElt(categoryLegend, 'u');
var					categoryLegendSpanPostU = bindNewElt(categoryLegend, 'span'),
   				categoryToggleDiv = bindNewElt(categoryFieldset, 'div');
					categoryFieldsetObj.toggleDiv = categoryToggleDiv;
var					categoryDiv = bindNewElt(categoryToggleDiv, 'div'),
							categoryDivAddBox = bindNewElt(categoryDiv, 'input'),
							categoryDivAddLabel = bindNewElt(categoryDiv, 'label'),
							categoryDivDoCBox = bindNewElt(categoryDiv, 'input'),
							categoryDivDoCLabel = bindNewElt(categoryDiv, 'label'),
							categoryDivRemBox = bindNewElt(categoryDiv, 'input'),
							categoryDivRemLabel = bindNewElt(categoryDiv, 'label'),
						categoryFieldRow;
					for( i = 0, len = categoryObjArr.length; i < len; i++ ) {
						categoryObj = categoryObjArr[i];
						categoryFieldRow = bindNewElt(categoryToggleDiv, 'div');
						categoryObj.input = bindNewElt(categoryToggleDiv, 'input');
						categoryObj.label = bindNewElt(categoryToggleDiv, 'label');
					}
					// TODO: Add in Add All/ DoC All / Rem All buttons
				// Skip unsubscribed friends
var			optionsFieldset = bindNewElt(body, 'fieldset'),
					optionsLegend = bindNewElt(optionsFieldset, 'legend');
					optionsSkipUnsubscribedObj.input = bindNewElt(optionsFieldset, 'input');
					optionsSkipUnsubscribedObj.label = bindNewElt(optionsFieldset, 'label');
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
		// Category span
			categoryDivAddBox.type = 'checkbox';
			categoryDivAddLabel.innerHTML = "<b>Add to feed</b>&nbsp;";
			categoryDivDoCBox.type = 'checkbox';
			categoryDivDoCLabel.innerHTML = "<i>Don't Change</i>&nbsp;";
			categoryDivRemBox.type = 'checkbox';
			categoryDivRemLabel.innerHTML = "Remove from feed";

		function getCategoryHTMLFn(categoryObj) {
			var labelHTML = categoryObj.value;
			return function () {
				var label = categoryObj.label,
						state = categoryObj.state;

				// -1 will be remove item from feed
				if( state === -1 ) {
					label.innerHTML = labelHTML;
				// 0 will be don't change
				} else if ( state === 0 ) {
					label.innerHTML = '<i>' + labelHTML + '</i>';
				// 1 will be add item to feed
				} else {
					label.innerHTML = '<b>' + labelHTML + '</b>';
				}
			};
		}

		for( i = 0, len = categoryObjArr.length; i < len; i++ ) {
			categoryObj = categoryObjArr[i];
			categoryObj.input.type = 'checkbox';
			categoryObj.htmlFn = exec( getCategoryHTMLFn(categoryObj) );
		}

	// Options fieldset
		optionsLegend.innerHTML = 'Options';
		optionsSkipUnsubscribedObj.input.type = 'checkbox';
		optionsSkipUnsubscribedObj.label.innerHTML = 'Skip unsubscribed friends';
	// Submit container
		submitButton.type = 'button';
		submitButton.value = 'Change All Subscriptions';

/** END FILL IN CONTENT **/

/** BEGIN STYLING CONTAINER **/
// Make it a popup with style (It's over 9000!!)
setStyle( container, 'z-index: 9001; border: 1px solid #000; width: 320px; position: fixed; left: 40%; top: 10%; background: #FFF; outline: 2px solid #FFF;' );

// Header
var paddingContainerChildren = 'padding: .2em .3em;';
setStyle( header, 'border-bottom: 1px solid #000; ' + paddingContainerChildren);
	setStyle( headerTitle, 'display: inline' );
	setStyle( closeButton, 'border: 1px solid #000; cursor: pointer; font-family: monospace; width: 1.1em; height: 1.2em; text-align: center; float: right; background: pink;' );
// Body
setStyle( body, paddingContainerChildren);
	// Level fieldset
	function getFieldsetStyleFn(fieldsetObj) {
		var toggleDiv = fieldsetObj.toggleDiv;
		setStyle( fieldsetObj.u, 'cursor: pointer' );
		return function () {
			var state = fieldsetObj.state,
					style = '';

			if( !state ) {
				style = 'display: none';
			}

			// TODO: Use a pre-existing class instead
			setStyle(toggleDiv, style);

			var i,
					state;
			// Bolden selection
			for( i = levelObjArr.length; i--; ) {
				levelObj = levelObjArr[i];
				state = levelObj.input.checked;
				setStyle( levelObj.label, state ? '' : 'font-weight: normal;' );
			}
		}
	}
	levelFieldsetObj.styleFn = exec( getFieldsetStyleFn(levelFieldsetObj) );
		// Radio buttons
		for( i = 0, len = levelObjArr.length; i < len; i++ ) {
			levelObj = levelObjArr[i];
			levelObj.input.checked = levelObj.checked;
		}
	// Category fieldset
		// Category span
		setStyle( categoryDiv, 'text-align: center; margin: 0.4em 0 0.6em;' );
			categoryDivAddBox.checked = true;
			setStyle( categoryDivAddLabel, 'font-weight: normal' );
			categoryDivDoCBox.indeterminate = true;
			setStyle( categoryDivDoCLabel, 'font-weight: normal' );
			categoryDivRemBox.checked = false;
			setStyle( categoryDivRemLabel, 'font-weight: normal' );

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
	// Options fieldset
	optionsSkipUnsubscribedObj.input.checked = true;
	optionsSkipUnsubscribedObj.styleFn = exec( function () {
		var state = optionsSkipUnsubscribedObj.input.checked;
		setStyle( optionsSkipUnsubscribedObj.label, state ? '' : 'font-weight: normal;' );
	} );
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
			levelObj.input.onclick = levelFieldsetObj.styleFn;
		}
	// Category fieldset
		// Legend
		categoryFieldsetObj.u.onclick = getFieldsetOnclick(categoryFieldsetObj);
		// Span
			function getCategoryBoxOnclick(state) {
				var $categoryObjArr = categoryObjArr,
						$preventNormal = preventNormal;
				return function (e) {
					var $$categoryObjArr = $categoryObjArr,
							$state = state,
							categoryObj,
							i = $$categoryObjArr.length;

					// Stop default action
					$preventNormal(e);

					for(;i--;) {
						categoryObj = $$categoryObjArr[i];
						categoryObj.state = $state;
						categoryObj.htmlFn();
						categoryObj.styleFn();
					}
				};

			}
			val = 'autoSubscribeCategoryDivAddBox';
			setAttributes( categoryDivAddBox, {
					'id': val,
					'name': val
				});
			categoryDivAddLabel.setAttribute('for', val);
			val = 'autoSubscribeCategoryDivDoCBox';
			setAttributes( categoryDivDoCBox, {
					'id': val,
					'name': val
				});
			categoryDivDoCLabel.setAttribute('for', val);

			val = 'autoSubscribeCcategoryDivRemBox';
			setAttributes( categoryDivRemBox, {
					'id': val,
					'name': val
				});
			categoryDivRemLabel.setAttribute('for', val);

			categoryDivAddBox.onclick = getCategoryBoxOnclick(1);
			categoryDivDoCBox.onclick = getCategoryBoxOnclick(0);
			categoryDivRemBox.onclick = getCategoryBoxOnclick(-1);
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

	// Options fieldset
		val = 'autoSubscribeSkipUnsubscribedFriends';
		input = optionsSkipUnsubscribedObj.input;
		setAttributes( input, {
					'id': val,
					'name': val,
					'checked': 'checked'
				});
		optionsSkipUnsubscribedObj.label.setAttribute('for', val);

		input.onclick = function () {
			optionsSkipUnsubscribedObj.styleFn();
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
					inputCategories = {};

			for( i = 0, len = categoryObjArr.length; i < len; i++ ) {
				categoryObj = categoryObjArr[i];

				if( categoryObj.state !== 0 ) {
					// Performance boost (Zakas)
					// Use your boost to get through!
					inputCategories[categoryObj.value] = (categoryObj.state === 1);
				}
			}

			return inputCategories;
		}

		submitButton.onclick = function () { // TODO: Collect info from disables
			var formData = {},
					options = { 'skipUnsubscribed': optionsSkipUnsubscribedObj.input.checked };

			if( levelFieldsetObj.state ) {
				formData.subscribeLevel = getLevel(levelObjArr);
			}

			if( categoryFieldsetObj.state ) {
				formData.categories = getCategories(categoryObjArr);
			}

			// Injected =)
			updateStatus('Scrolling profiles...');
			scrollFriendsAsync( function () {
				updateStatus('Collecting subscriptions...');

				var body = document.body,
						UIBlocksLen = DOM.scry( body, '.UIImageBlock_Entity' ).length;

				grabAllSubscriptions({
					'eachFn': function (index, elt) {
						updateStatus('Collecting subscriptions (' + index + '/' + UIBlocksLen + ')');
					},
					'callback': function (profiles) {
						updateStatus('Updating subscriptions...');
						var setAllSubscriptions = setAllSubscriptionsGenerator(
								formData,
								options
							);

						setAllSubscriptions(profiles, function () {
							updateStatus('Waiting for changes to complete.');
							setTimeout( function () {
								updateStatus('Refreshing your browser.<br/>You should see changes once the page reloads.<br/>Thank you and have a nice day!');
								location.reload();
							}, 5000 );
						});
					}
				});
			} );
		};
/** END FUNCTIONALITY BINDING **/

// Expose container to the world
d.body.appendChild(container);

/** BEGIN PATCH FOR WRONG PAGE **/
var pageQueryString = location.search || '';
if( !pageQueryString.match(/sk=subscribedto/) || !pageQueryString.match(/filter=1/) ) {
	updateStatus('You are not on the correct page.<br/>Click the link below to go to the correct page.<br/>From there, reload this script.<br/><br/><a href="http://www.facebook.com/profile.php?sk=subscribedto&filter=1">http://www.facebook.com/profile.php?sk=subscribedto&filter=1</a>');
	return;
}
/** END PATCH FOR WRONG PAGE **/

// TODO: Rebuild unsubscribe friends to handle any callback fn
// TODO: Make each getter and setter do a run ONLY once, then handle the callback management outside of that. This will allow for more robust eachFn as well as interesting objects to manage it.
}(document));