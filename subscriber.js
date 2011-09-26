// Don't want to pollute Facebook namespace ;)

(function(){
var UIBlocks = DOM.scry( document.body,'.UIImageBlock_Entity' ),
		UIBlockLen = 0,
    finalUIBlock,
    dataKeys = ['Other Activity', 'Music and Videos', 'Comments and Likes', 'Games', 'Photos', 'Status Updates', 'Life Events', 'Only Important', 'Most Updates', 'All Updates'],
		inputSubscribeLevel = 'All Updates', // TODO: Grab inputDataLevel from modal
		inputWatchLevels = ['Life Events'],	// TODO: Grab inputDataLevel from modal
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

// Scroll through all profiles
function scrollFriendsAsync() {
	function callbackSelf() {
		setTimeout( scrollFriendsAsync, 1000 );
	}

	// Ensure that the remaining profiles are done loading
	var UIPageLoader = DOM.find(document.body, '.uiMorePagerLoader');
	if( UIPageLoader && getDisplay( UIPageLoader ) !== 'none' ) {
		callbackSelf(); // TODO: DEBUG PAGELOADER VISIBILITY
		return;
	}

	// If condition is met, fire the callback and leave
	if( UIBlockLen === UIBlocks.length ) {
		setAllSubscriptions();
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
}

// Start us off
scrollFriendsAsync();

}());