'use strict';
var newGameButton, addPlayerButton, cutDeckButton, dealButton, userTemplate, playersDiv, stakesElem, bankerDisplay, twistButtons, splitHandButton;


// PUB-SUB
(function( $ ) { // Can't pass arrays with this implementation
	var o = $( {} );
	$.each({
		trigger: 'publish', // 'dealt' [dealOrder], 'handUpdate' [hand]
		on: 'subscribe',
		off: 'unsubscribe'
	}, function(key, val) {
		jQuery[val] = function() {
			o[key].apply(o, arguments);
		};
	});
})( jQuery )


function init() {
	cache();
	newGameButton.addEventListener('click', newGame);

	gameStart();
	addPlayer('Nat');
	addPlayer('Joe');
	addPlayer('Brian');
}

function cache() {
	stakesElem = document.getElementById('stakes');
	bankerDisplay = document.getElementById('banker');
	newGameButton = document.getElementById('new-game');
	addPlayerButton = document.getElementById('add-player');
	cutDeckButton = document.getElementById('cut-deck');
	dealButton = document.getElementById('deal');
	playersDiv = document.getElementById('container');
	userTemplate = document.getElementById('user-template').innerHTML.trim();
}

function bindEvents() {
	addPlayerButton.addEventListener('click', addPlayer);
	cutDeckButton.addEventListener('click', () => { cutForBanker(); });
	dealButton.addEventListener('click', () => { 
		table.deal(); displayHand(table.dealOrder);

		twistButtons = document.getElementsByClassName('twist');
		registerEventHandlers(twistButtons, 'click', twist);

		splitHandButton = document.getElementsByClassName('split');
		registerEventHandlers(splitHandButton, 'click', splitHand);
	});
}

function gameStart() {
	table = new Table(50, 500);
	deck.shuffle();

	stakesElem.innerHTML = table.loStake + ' / ' + table.hiStake;

	bindEvents();
}

function newGame() {
	deck = new Deck();
	deck.shuffle();
	for (var i = 0, len = table.dealOrder.length; i < len; i++) {
		var player = players.lookup(table.dealOrder[i]);

		player.hand = new Hand();
		document.getElementById('hand_' + player.id).innerHTML = '';
		document.getElementById('hand-total_' + player.id).innerHTML = '';
	}
}

function addPlayer(name) {
	var name = name ? name : prompt('Enter player name.');
	if (!name) { }
	else if (name === '') { addPlayer(); } 
	else {
		var id = table.addToTable(name);
		displayPlayer( players.lookup(id) );
	}
}

function displayPlayer(player) {
	var list = '';

	list += userTemplate.replace(/{{id}}/g, player.id)
						.replace(/{{name}}/i, player.name)
						.replace(/{{chips}}/i, player.chips);

	playersDiv.innerHTML += list;
}

function cutForBanker() {
	if (!table.banker) {
		var banker = table.determineDealer(),
			nameDisplay = document.getElementById( 'player_' + banker );
		
		if (banker || banker === 0) {
			nameDisplay.className += ' banker';
			bankerDisplay.innerHTML = players.lookup(banker).name;
			displayCut();
		}

		table.setDealOrder();
		cutDeckButton.setAttribute('disabled', 'true');
	}
}

function displayCut() {
	for (var i = 0; i < table.dealOrder.length; i++) {
		var player = players.lookup( table.dealOrder[i] ),
			cutSpan = document.getElementById( 'cut_' + player.id );

		cutSpan.className += ' ' + player.cutCard.suit;
		cutSpan.innerHTML = charMap[player.cutCard.name()];
	}
}

function displayHand(order) { 
	for (var i = 0; i < order.length; i++) {
		var player = players.lookup(order[i]),
			handLen = player.hand.cards.length -1,
			card = player.hand.cards[handLen].name(),
			handSpan = document.getElementById('hand_' + player.id),
			handTotalSpan = document.getElementById('hand-total_' + player.id);

		handSpan.innerHTML += '<span class=" ' + player.hand.cards[handLen].suit + '">' + charMap[card] + '</span>';
		handTotalSpan.innerHTML = player.hand.total();
	}
}

function checkHand() {

}

function splitHand() {
	// Add new player display (hand) next to original. This hand is played after the original has finished it's turn
	splitHandButton = document.getElementById('split-hand');

}

function twist() {
	players.lookup(this.id).twist();
	displayHand([this.id]);
}


// HELPER FUNCTIONS
function registerEventHandlers(nodes, event, handler) {
	forEach(nodes, function(node) {
		node.addEventListener(event, handler);
	});
}

init();