// PUB-SUB
(function( $ ) {
	var o = $( {} );
	$.each({
		trigger: 'publish',
		on: 'subscribe',
		off: 'unsubscribe'
	}, function(key, val) { // Multiple arguments can be passed as array
		jQuery[val] = function() {
			o[key].apply(o, arguments);
		};
	});
})( jQuery )