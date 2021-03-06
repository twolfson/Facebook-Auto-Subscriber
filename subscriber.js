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
	// body.innerHTML = msg;
	console.log(msg);
}

/** BEGIN PATCH FOR WRONG PAGE **/
var pageQueryString = location.search || '';
if( !pageQueryString.match(/sk=subscribedto/) || !pageQueryString.match(/filter=1/) ) {
	updateStatus('You are not on the correct page.<br/>Click the link below to go to the correct page.<br/>From there, reload this script.<br/><br/><a href="http://www.facebook.com/profile.php?sk=subscribedto&filter=1">http://www.facebook.com/profile.php?sk=subscribedto&filter=1</a>');
	return;
}
/** END PATCH FOR WRONG PAGE **/

// Start us off (this will be the injection point)
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
					{ 'categories': {'Life Events': true} },
					{ 'skipUnsubscribed': true }
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

}());