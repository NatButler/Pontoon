'use strict';
var pontoon, newGameButton, newDealButton, addPlayerButton, cutDeckButton, dealButton, userTemplate, playersDiv, stakesElem, bankerDisplay, twistButtons, splitHandButton, stickButtons, turnDisplay, buyButtons, betButtons;


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

	gameStart();
	addPlayer('Nat');
	addPlayer('Joe');
	addPlayer('Brian');
}

function cache() {
	stakesElem = document.getElementById('stakes');
	bankerDisplay = document.getElementById('banker');
	newGameButton = document.getElementById('new-game');
	newDealButton = document.getElementById('new-deal');
	addPlayerButton = document.getElementById('add-player');
	cutDeckButton = document.getElementById('cut-deck');
	dealButton = document.getElementById('deal');
	playersDiv = document.getElementById('container');
	turnDisplay = document.getElementById('turn');
	userTemplate = document.getElementById('user-template').innerHTML.trim();
	twistButtons = document.getElementsByClassName('twist');
	splitHandButton = document.getElementsByClassName('split');
	stickButtons = document.getElementsByClassName('stick');
	buyButtons = document.getElementsByClassName('buy');
	betButtons = document.getElementsByClassName('bet');
}

function bindEvents() {
	addPlayerButton.addEventListener('click', addPlayer);
	cutDeckButton.addEventListener('click', () => { cutForBanker(); });
	dealButton.addEventListener('click', () => { 
		pontoon.table.deal(); 
		displayHand(pontoon.table.dealOrder);

		registerEventHandlers(twistButtons, 'click', twist);
		registerEventHandlers(splitHandButton, 'click', splitHand);
		registerEventHandlers(stickButtons, 'click', stick);
		registerEventHandlers(buyButtons, 'click', buy);
		registerEventHandlers(betButtons, 'click', bet);
	});
	newGameButton.addEventListener('click', newGame);


}

function gameStart() {
	pontoon = new Pontoon(50, 500);
	pontoon.table.deck.shuffle();

	pontoon.setState('gameStart');

	stakesElem.innerHTML = pontoon.loStake + ' / ' + pontoon.hiStake;

	bindEvents();
}

function newGame() {
	pontoon.table.deck = new Deck({
		cardVals: cardVals
	});
	pontoon.table.deck.shuffle();

	pontoon.setState('gameStart');

	dealButton.removeAttribute('disabled');
	newGameButton.setAttribute('disabled', true);

	pontoon.table.playerTurn = [];
	pontoon.table.hands = [];
	turnDisplay.innerHTML = '';

	for (var i = 0, len = pontoon.table.dealOrder.length; i < len; i++) {
		var player = pontoon.players.lookup(pontoon.table.dealOrder[i]);

		player.hand = new Hand();
		document.getElementById('hand_' + player.id).innerHTML = '';
		document.getElementById('hand-total_' + player.id).innerHTML = '';
		document.getElementById('hand-state_' + player.id).innerHTML = '';
		stickButtons[i].setAttribute('disabled', true);
	}
}

function newDeal() {
	
}

function addPlayer(name) {
	if (pontoon.table.dealOrder.length < 8) {
		var name = name.target ? prompt('Enter player name.') : name;
		if (!name) { }
		else if (name === '') { addPlayer(); } 
		else {
			var id = pontoon.table.addToTable(name);
			displayPlayer( pontoon.players.lookup(id) );
		}
		if (pontoon.table.dealOrder.length === 8) {
			addPlayerButton.setAttribute('disabled', true);
		}
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
	if (!pontoon.table.banker) {
		var banker = pontoon.table.determineDealer(),
			nameDisplay = document.getElementById( 'player_' + banker );
		
		if (banker || banker === 0) {
			nameDisplay.className += ' banker';
			bankerDisplay.innerHTML = pontoon.players.lookup(banker).name;
			displayCut();
		}

		pontoon.table.setDealOrder();
		cutDeckButton.setAttribute('disabled', 'true');

		addPlayerButton.setAttribute('disabled', true);
	}
}

function displayCut() {
	for (var i = 0; i < pontoon.table.dealOrder.length; i++) {
		var player = pontoon.players.lookup( pontoon.table.dealOrder[i] ),
			cutSpan = document.getElementById( 'cut_' + player.id );

		cutSpan.className += ' ' + player.cutCard.suit;
		cutSpan.innerHTML = charMap[player.cutCard.name()];
	}
	$('.cut').fadeOut(5000);
}

function displayHand(order) { 
	for (var i = 0; i < order.length; i++) {
		var hand = pontoon.players.lookup(order[i]).hand,
			handLen = hand.cards.length -1,
			card = hand.cards[handLen].name(),
			handSpan = document.getElementById('hand_' + order[i]),
			handTotalSpan = document.getElementById('hand-total_' + order[i]),
			handStateSpan = document.getElementById('hand-state_' + order[i]),
			handTotal = hand.value,
			handState = hand.state;

		if (order[i] !== pontoon.table.banker) {
			handSpan.innerHTML += '<span class=" ' + hand.cards[handLen].suit + '">' + charMap[card] + '</span>';
			handTotalSpan.innerHTML = (handTotal >= 21) ? '' : handTotal;
			if (handState) { handStateSpan.innerHTML = handState; }
		}
		else {
			if (pontoon.table.playerTurn[0] === pontoon.table.banker) {
				handSpan.innerHTML = '';
				for (var i = 0; i < hand.cards.length; i++) {
					var card = hand.cards[i].name();
					handSpan.innerHTML += '<span class=" ' + hand.cards[i].suit + '">' + charMap[card] + '</span>';
				}
				handTotalSpan.innerHTML = (handTotal >= 21 && handState !== '(Soft)' ) ? '' : handTotal;
				if (handState) { handStateSpan.innerHTML = handState; }
			} else {
				handSpan.innerHTML += '<span>' + charMap['Reverse'] + '</span>';
			}
		}
	}
}

function displayBet(id) {
	document.getElementById('bet-total_'+id).innerHTML = pontoon.players.lookup(id).betTotal();
	document.getElementById('chips_'+id).innerHTML = pontoon.players.lookup(id).chips;

	betsFinished();
}

function betsFinished() {
	for (var i = 0; i < pontoon.table.dealOrder.length; i++) {

	}
}

function checkHand(player, hand) {
	switch (hand) {
		case 'Bust':
			player.bust();
			break;
		case 'Pontoon':
			break;
		case '5 card trick':
			break;
	}
}

function splitHand() {
	console.log('Split hand');

	var id = pontoon.table.playerTurn[0],
		splitHandSpan = document.getElementById('split-hand-'+id);

	pontoon.players.lookup(id).splitHand();

	displayHand([id]);

}

function buy() {

}

function bet() {
	var id = this.id.split('-');
	console.log(id[1] + ' placed a bet');
	pontoon.players.lookup(id[1]).bet(pontoon.loStake);
	this.setAttribute('disabled', true);
	displayBet(id[1]);
}

function twist() {
	console.log('Twist');
	var player = pontoon.table.playerTurn;
	pontoon.players.lookup(player).twist();
	displayHand([player]);
	$.publish('Twist', pontoon.table.playerTurn);
}

function stick() {
	console.log('Stick');
	document.getElementById('stick-'+pontoon.table.playerTurn[0]).setAttribute('disabled', true);
	document.getElementById('twist-'+pontoon.table.playerTurn[0]).setAttribute('disabled', true);
	document.getElementById('buy-'+pontoon.table.playerTurn[0]).setAttribute('disabled', true);

	if (pontoon.table.playerTurn[0] === pontoon.table.banker) {
		$.publish('gameFinished', pontoon.table.playerTurn);
	} else {
		$.publish('turnFinished', pontoon.table.playerTurn);
	}
}


// SUBSCRIPTIONS
$.subscribe('gameStart', function() {
	console.log('Game started');
});

$.subscribe('firstDeal', function() {
	console.log('First deal: initial stakes');
	pontoon.setState('initialStakes');
});

$.subscribe('initialStakes', function() {
	dealButton.setAttribute('disabled', true);

	for (var i = 0; i < pontoon.table.dealOrder.length; i++) {
		if (pontoon.table.dealOrder[i] !== pontoon.table.banker) {
			document.getElementById('bet-'+pontoon.table.dealOrder[i]).removeAttribute('disabled');
		}
	}
});

$.subscribe('betsFinished', function() {
	dealButton.removeAttribute('disabled');
});

$.subscribe('dealFinished', function() {
	console.log('Deal finished: turns');
	dealButton.setAttribute('disabled', true);
	pontoon.setState('playerTurns');
});

$.subscribe('playerTurns', function() {
	if (pontoon.players.lookup(pontoon.table.banker).hand.state === 'Pontoon') {
		displayHand([pontoon.table.banker]);
		$.publish('gameFinished');
	} else {
		var id = pontoon.table.turns();

		turnDisplay.innerHTML = pontoon.players.lookup(id).name;

		if (pontoon.players.lookup(id).hand.state !== 'Pontoon') {
			document.getElementById('twist-'+id).removeAttribute('disabled');
			document.getElementById('buy-'+id).removeAttribute('disabled');

			if (pontoon.players.lookup(id).hand.value >= 15) {
				document.getElementById('stick-'+id).removeAttribute('disabled');
			}

			if (pontoon.players.lookup(id).hand.cards[0].rank === pontoon.players.lookup(id).hand.cards[1].rank) {
				document.getElementById('split-'+id).removeAttribute('disabled');
			}
		} else {
			$.publish('turnFinished', id);
		}
	}
});

$.subscribe('turnFinished', function(e, id) {
	console.log('Next turn: '+id);
	document.getElementById('twist-'+id).setAttribute('disabled', true);
	document.getElementById('stick-'+id).setAttribute('disabled', true);
	document.getElementById('split-'+id).setAttribute('disabled', true);

	if (pontoon.players.lookup(id).hand.state != 'Bust') {
		pontoon.table.hands.push(id);
	} else {
		pontoon.players.lookup(id).bust();
	}

	var nextId = pontoon.table.turns(),
		player = pontoon.players.lookup(nextId),
		hand;

		if (nextId === id) {
			hand = player.splitHand;
		} else {
			hand = player.hand;
		}

	turnDisplay.innerHTML = player.name;
	document.getElementById('twist-'+nextId).removeAttribute('disabled');

	if (hand.state !== 'Pontoon') {
		if (nextId !== pontoon.table.banker) {
			document.getElementById('buy-'+nextId).removeAttribute('disabled');

			if (hand.cards[0].rank === hand.cards[1].rank) {
				document.getElementById('split-'+nextId).removeAttribute('disabled');
			}
		} else {
			displayHand([nextId]);	
		}

		if (hand.value >= 15) {
			document.getElementById('stick-'+nextId).removeAttribute('disabled');
		}
	} else {
		$.publish('turnFinished', nextId);
	}

});

$.subscribe('gameFinished', function() {
	console.log('Turns finished: check hands');

	var id = pontoon.table.playerTurn[0];
	document.getElementById('twist-'+id).setAttribute('disabled', true);
	document.getElementById('stick-'+id).setAttribute('disabled', true);

	newGameButton.removeAttribute('disabled');
});

$.subscribe('Twist', function(e, id) {
	document.getElementById('split-'+id).setAttribute('disabled', true);
	document.getElementById('buy-'+id).setAttribute('disabled', true);

	var hand = pontoon.players.lookup(id).hand;

	if (hand.value >= 15) {
		document.getElementById('stick-'+id).removeAttribute('disabled');
	}

	if (id === pontoon.table.banker) {
		if (hand.state === 'Pontoon') {
			$.publish('gameFinished');
		} else if (hand.state === 'Bust') {
			$.publish('gameFinished');
		} else if (hand.cards.length === 5) {
			$.publish('gameFinished');
		} else if (hand.state === '21') {
			$.publish('gameFinished');
		} else if (hand.value === 21 && hand.state != 'Soft') {
			// Compare hand to highest player hand
		}
	} else {
		if (hand.cards.length === 5) {
			$.publish('turnFinished', id);
		} else if (hand.state === 'Pontoon') {
			$.publish('turnFinished', id);
		} else if (hand.state === 'Bust') {
			$.publish('turnFinished', id);
		} else if (hand.state === '21') {
			$.publish('turnFinished', id);
		} else if (hand.value === 21 && hand.state != 'Soft') {
			$.publish('turnFinished', id);
		}
	}

});


// UTILITY FUNCTIONS
function registerEventHandlers(nodes, event, handler) {
	forEach(nodes, function(node) {
		node.addEventListener(event, handler);
	});
}

init();