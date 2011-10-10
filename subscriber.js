// Don't want to pollute Facebook namespace ;)

(function(){
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

// TODO: Make faster (scrape page better)
function grabAllSubscriptions(callback) {
	var body = document.body,
			UIBlocks = DOM.scry( body, '.UIImageBlock_Entity' ),
			UIBlock,
			UIBlockIndex,
			UIBlockLen,
			profiles = [],
			profile,
			rowIdentifier,
			checkedRegex = /(^|\s)\s*checked\s*(\s|$)/;

	for( UIBlockIndex = 0, UIBlockLen = UIBlocks.length; UIBlockIndex < UIBlockLen; UIBlockIndex++ ) {
	// for( UIBlockIndex = 0, UIBlockLen = 1; UIBlockIndex < UIBlockLen; UIBlockIndex++ ) {
		UIBlock = UIBlocks[UIBlockIndex];
		rowIdentifier = 'Row ' + UIBlockIndex;

		try {
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
			var content = document.getElementById('subscriptionFlyoutContent');
			EditSubscriptions.init(content, profileId, 3);


			// Grab the menu items
			var menuItems = DOM.scry(body, '.SubscriptionMenuItem'),
					menuItem,
					menuText,
					i;

			// Get values of each item
			for( i = menuItems.length; i--; ) {
				menuItem = menuItems[i];

				// Remove the hidden overlays
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

	// Spit out errors
	if( failedRows.length > 0 ) {
		alert( 'Errors occurred with:\n' + failedRows.join('\n') );
	}

	// Callback with profiles
	callback = callback || noop;
	callback(profiles);
}

/**
 * @param {Object} inputs Container object for inputs
 * @param {String} inputs.subscribeLevel Subscription level (All Updates, Most Updates, Only Important)
 * @param {Object} inputs.categories Levels to watch (Keys: Comments and Likes, Games, Life Events, Music and Videos, Other Activity, Photos, Status Updates)
 * @param {Boolean} inputs.categories.key If true, check item. If false, uncheck item. If never specified, use default.
 * @param {Object} [options] Options object
 * @param {Boolean} [skipUnsubscribed] Skip all unsubscribed persons
 * @param {Boolean} [unsubscribeAll] Unsubscribe all of your friends // TODO: Build into special alt script
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
				return;
			}

			// TODO: Check for unsubscribed

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

// Start us off (this will be the injection point)
scrollFriendsAsync( function () {
	grabAllSubscriptions(
		setAllSubscriptionsGenerator(
			{ 'subscribeLevel': 'Most Important',
				'categories': {'Life Events': true} }
		)
	);
} );

}());