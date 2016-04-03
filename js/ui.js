'use strict';
var pontoon, newShuffleButton, newDealButton, addPlayerButton, cutDeckButton, dealButton, userTemplate, playersDiv, stakesElem, bankerDisplay, twistButtons, stickButtons, buyButtons, betButtons, statusDisp;

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


function init() {
	cache();
	bindEvents();

	// Pass in stakes and players as config object?
	pontoon = new Pontoon(50, 500);
	pontoon.table.deck.shuffle(11);
	stakesElem.innerHTML = pontoon.loStake + ' / ' + pontoon.hiStake;

	addPlayer('Nat');
	addPlayer('Joe');
	addPlayer('Brian');
}

function cache() {
	stakesElem = document.getElementById('stakes');
	bankerDisplay = document.getElementById('banker');
	newShuffleButton = document.getElementById('new-shuffle');
	newDealButton = document.getElementById('new-deal');
	addPlayerButton = document.getElementById('add-player');
	playersDiv = document.getElementById('container');
	cutDeckButton = document.getElementById('cut-deck');
	dealButton = document.getElementById('deal');
	statusDisp = document.getElementById('status');
	userTemplate = document.getElementById('user-template').innerHTML.trim();
	twistButtons = document.getElementsByClassName('twist');
	stickButtons = document.getElementsByClassName('stick');
	buyButtons = document.getElementsByClassName('buy');
	betButtons = document.getElementsByClassName('bet');
}

function bindEvents() {
	addPlayerButton.addEventListener('click', addPlayer);
	cutDeckButton.addEventListener('click', cutForBanker);
	dealButton.addEventListener('click', () => { pontoon.table.deal(); });
	newShuffleButton.addEventListener('click', newShuffle);
	newDealButton.addEventListener('click', newDeal);
}

function bindTurnEvents() {
	registerEventHandlers(twistButtons, 'click', twist);
	registerEventHandlers(stickButtons, 'click', stick );
	registerEventHandlers(buyButtons, 'click', buy);
	registerEventHandlers(betButtons, 'click', bet);
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
			nameDisplay.className = 'banker';
			bankerDisplay.innerHTML = pontoon.players.lookup(banker).name;
			displayCut();
		}
	}
	console.log('Banker: ' + pontoon.players.lookup(banker).name + ' cut the highest card');
	$.publish('gameStart');
}

function displayCut() {
	for (var i = 0; i < pontoon.table.dealOrder.length; i++) {
		var player = pontoon.players.lookup( pontoon.table.dealOrder[i] ),
			cutSpan = document.getElementById( 'cut_' + player.id );

		cutSpan.className += ' ' + player.cutCard.suit;
		cutSpan.innerHTML = charMap[player.cutCard.name()];
	}
	$('.cut').fadeOut(1500);
}

function displayHand(order) { 
	for (var i = 0; i < order.length; i++) {
		var hand = pontoon.players.lookup(order[i]).hand,
			handLen = hand.cards.length -1,
			card = hand.cards[handLen].name(),
			handTotal = hand.value,
			handState = hand.state,
			handName = hand.name,
			handSpan = document.getElementById('hand_' + order[i]),
			handNameSpan = document.getElementById('hand-name_' + order[i]),
			handStateSpan = document.getElementById('hand-state_' + order[i]);

		if (order[i] !== pontoon.table.banker) {
			handSpan.innerHTML += '<span class=" ' + hand.cards[handLen].suit + '">' + charMap[card] + '</span>';
			handNameSpan.innerHTML = (handTotal > 21) ? '' : handName;

			if (handState) { handStateSpan.innerHTML = handState; } 
			else { handStateSpan.innerHTML = ''; }
			
			if (order.length > 1) { console.log(order[i] + ': ' + handName ); }
		}
		else {
			if (pontoon.table.playerTurn[0] === pontoon.table.banker) {
				handSpan.innerHTML = '';
				for (var j = 0; j < hand.cards.length; j++) {
					var card = hand.cards[j].name();
					handSpan.innerHTML += '<span class=" ' + hand.cards[j].suit + '">' + charMap[card] + '</span>';
				}
				handNameSpan.innerHTML = (handTotal > 21 && handState !== '(Soft)' ) ? '' : handName;
			
				if (handState) { handStateSpan.innerHTML = handState; } 
				else { handStateSpan.innerHTML = ''; }
			
				if (order.length > 1) { console.log(order[i] + ': ' + handName ); }
			} else {
				handSpan.innerHTML += '<span>' + charMap['Reverse'] + '</span>';
				console.log(order[i] + ': ' + '(Banker)' );
			}
		}
	}
}

function buy() {
	var id = pontoon.table.playerTurn[0];
	pontoon.players.lookup(id).buy(pontoon.loStake);
}

function bet() {
	var id = this.id.split('-');
	console.log(id[1] + ' placed a bet of ' + pontoon.loStake);
	pontoon.players.lookup(id[1]).bet(pontoon.loStake);
	this.setAttribute('disabled', true);
	displayBet(id[1]);
}

function twist() {
	var id = pontoon.table.playerTurn[0];
	pontoon.players.lookup(id).twist();
}

function stick() {
	console.log('Stick: ' + pontoon.players.lookup(pontoon.table.playerTurn[0]).hand.name);
	$.publish('turnFinished', pontoon.table.playerTurn[0]);
}

function checkHands(order) {
	var pontoons;
	var banker = pontoon.players.lookup(pontoon.table.banker);
	for (var i = 0; i < order.length; i++) {
		var player = pontoon.players.lookup(order[i]),
			playerDiv = document.getElementById(player.id);
		if (banker.hand.name === 'Pontoon') {
			statusDisp.innerHTML = 'Banker has pontoon';
			document.getElementById(banker.id).style.background = '#EFFFF0';
			document.getElementById('hand_' + player.id).style.opacity = '0.3';
			banker.chips += player.betTotal();
			if (!pontoons) {pontoons = 'Banker';}
		}
		else if (banker.hand.name === 'Bust') {
			statusDisp.innerHTML = 'Banker is bust';
			document.getElementById('hand_' + banker.id).style.opacity = '0.3';
			player.chips += player.betTotal();
			if (player.hand.name === 'Pontoon') { var win = player.betTotal() * 2; if (!pontoons) {pontoons = order[i];} }
			else if (player.hand.name === '5 card trick') { var win = player.betTotal() * 2; }
			else { var win = player.betTotal(); }
			banker.chips -= win;
			player.chips += win;
			playerDiv.style.background = '#EFFFF0';
		} 
		else if (banker.hand.name === '21') {
			statusDisp.innerHTML = 'Banker has 21';
			var win = player.betTotal();
			if (player.hand.name === 'Pontoon') { 
				banker.chips -= win * 2;
				player.chips += win * 3;
				playerDiv.style.background = '#EFFFF0';
				if (!pontoons) {pontoons = order[i];}
			}
			else if (player.hand.name === '5 card trick') {
				banker.chips -= win * 2;
				player.chips += win * 3;
				playerDiv.style.background = '#EFFFF0';
			}
			else { banker.chips += win; }
		} 
		else if (banker.hand.name === '5 card trick') {
			statusDisp.innerHTML = 'Banker has a 5 card trick';
			var win = player.betTotal();				
			if (player.hand.name === 'Pontoon') {
				banker.chips -= win * 2;
				player.chips += win * 3;
				playerDiv.style.background = '#EFFFF0';
				if (!pontoons) {pontoons = order[i];}
			}
			else { banker.chips += win; }
		}
		else if (banker.hand.value < 21) {
			statusDisp.innerHTML = 'Paying ' + (+banker.hand.value + 1);
			var win = player.betTotal();
			if (player.hand.name === 'Pontoon') { 
				banker.chips -= win * 2;
				player.chips += win * 3;
				playerDiv.style.background = '#EFFFF0';
				if (!pontoons) {pontoons = order[i];}
			}
			else if (player.hand.name === '5 card trick') {
				banker.chips -= win * 2;
				player.chips += win * 3;
				playerDiv.style.background = '#EFFFF0';
			}
			else if (player.hand.value > banker.hand.value) {
				banker.chips -= win;
				player.chips += win * 2;
				playerDiv.style.background = '#EFFFF0';
			}
			else { banker.chips += win; }
		}
		player.bets = [];
		displayBet(order[i]);
	}
	displayBet(banker.id);
	console.log(statusDisp.innerHTML);
	return pontoons;
}

function displayBet(id) {
	var player = pontoon.players.lookup(id);
	document.getElementById('stake-total_'+id).innerHTML = (player.betTotal() === 0) ? '' : player.betTotal();
	document.getElementById('chips_'+id).innerHTML = player.chips;

	if (pontoon.table.playerTurn.length === 0 && pontoon.players.lookup(pontoon.table.banker).hand.name != 'Pontoon') { betsFinished(); }
}

function betsFinished() {
	var bets = 0;
	for (var i = 0; i < pontoon.table.dealOrder.length; i++) {
		if ( pontoon.players.lookup(pontoon.table.dealOrder[i]).bets.length > 0 ) { bets++; }
	}

	if (bets === pontoon.table.dealOrder.length -1) { $.publish('betsFinished'); }
}

function returnCards() {
	for (var i = 0, len = pontoon.table.dealOrder.length; i < len; i++) {
		pontoon.players.lookup(pontoon.table.dealOrder[i]).returnCards();		
	}
}

function newDeal() {
	console.log('New deal');
	newDealButton.setAttribute('disabled', true);
	resetGame();
	resetHandDisp(pontoon.table.dealOrder);
}

function newShuffle() {
	console.log('New shuffle');
	pontoon.table.deck.shuffle(11);
	newShuffleButton.setAttribute('disabled', true);
	bankerDisplay.innerHTML = pontoon.players.lookup(pontoon.table.banker).name;
	resetGame();
	resetHandDisp(pontoon.table.dealOrder);
}

function resetGame() {
	dealButton.removeAttribute('disabled');
	pontoon.table.playerTurn = [];
	pontoon.table.hands = [];
	statusDisp.innerHTML = '';
}

function resetHandDisp(order) {
	for (var i = 0, len = order.length; i < len; i++) {
		var id = order[i],
			handSpan = document.getElementById('hand_' + id);

		handSpan.innerHTML = '';
		handSpan.removeAttribute('style');
		document.getElementById(id).removeAttribute('style');
		document.getElementById('hand-name_' + id).innerHTML = '';
		document.getElementById('hand-state_' + id).innerHTML = '';
	}
}

function resetPlayerDisplay(id) {
	document.getElementById('controls_'+id).removeAttribute('style');
	document.getElementById('twist-'+id).setAttribute('disabled', true);
	document.getElementById('buy-'+id).setAttribute('disabled', true);
	document.getElementById('stick-'+id).setAttribute('disabled', true);
}


// SUBS
$.subscribe('gameStart', function() {
	console.log('Game started');
	pontoon.table.setDealOrder();
	cutDeckButton.setAttribute('disabled', true);
	addPlayerButton.setAttribute('disabled', true);
	dealButton.removeAttribute('disabled');
});

$.subscribe('firstDeal', function() {
	console.log('First deal: initial stakes');
	bindTurnEvents();
	displayHand(pontoon.table.dealOrder);
	$.publish('initialStakes');
});

$.subscribe('initialStakes', function() {
	dealButton.setAttribute('disabled', true);
	statusDisp.innerHTML = 'First deal: place bets';
	for (var i = 0; i < pontoon.table.dealOrder.length; i++) {
		if (pontoon.table.dealOrder[i] !== pontoon.table.banker) {
			document.getElementById('bet-'+pontoon.table.dealOrder[i]).removeAttribute('disabled');
		}
	}
});

$.subscribe('betsFinished', function() {
	console.log('Bets finsihed');
	statusDisp.innerHTML = 'Bets placed: turns';
	dealButton.removeAttribute('disabled');
});

$.subscribe('secondDeal', function() {
	displayHand(pontoon.table.dealOrder);
	$.publish('dealFinished');
});

$.subscribe('dealFinished', function() {
	console.log('Deal finished');
	dealButton.setAttribute('disabled', true);
	if (pontoon.players.lookup(pontoon.table.banker).hand.name === 'Pontoon') {
		pontoon.table.playerTurn = [pontoon.table.banker];
		displayHand([pontoon.table.banker]);
		$.publish('gameFinished');
	} 
	else { $.publish('playerTurn'); }
});

$.subscribe('playerTurn', function() {
	var id = pontoon.table.turns(),
		player = pontoon.players.lookup(id);

	statusDisp.innerHTML = 'Player turn: ' + player.name;
	console.log('Turn: '+id);

	if (id === pontoon.table.banker && pontoon.table.hands.length === 0) {
		statusDisp.innerHTML = 'New deal';
		player.returnCards();
		newDealButton.removeAttribute('disabled');
		return;
	} 
	else if (id === pontoon.table.banker) { displayHand([id]); }

	if (player.hand.name !== 'Pontoon') {
		document.getElementById('controls_'+id).style.background = '#E5E5E5'; // FEFFD2 FCFCFC activeborder 76A0C7 52708B D1D6DB
		document.getElementById('controls_'+id).style.outline = '1px solid #E2E2E2'; // E4E5A2
		document.getElementById('twist-'+id).removeAttribute('disabled');
		if (id != pontoon.table.banker) { document.getElementById('buy-'+id).removeAttribute('disabled'); }
		if (player.hand.value >= 15) { document.getElementById('stick-'+id).removeAttribute('disabled'); }
	} 
	else { $.publish('turnFinished', id); }

});

$.subscribe('turnFinished', function(e, id) {
	resetPlayerDisplay(id);

	if (id != pontoon.table.banker) {
		if (pontoon.players.lookup(id).hand.state != 'Bust') { pontoon.table.hands.push(id); } 
		else {
			pontoon.players.lookup(id).bust();
			document.getElementById('hand_'+id).style.opacity = '0.3';
			displayBet(id);
			displayBet(pontoon.table.banker);
		}
		$.publish('playerTurn');
	} 
	else { $.publish('gameFinished'); }
});

$.subscribe('gameFinished', function(e, id) {
	console.log('Turns finished: check hands');
	if (id) { 
		resetPlayerDisplay(id);
		var order = pontoon.table.hands;
	} else { 
		var order = pontoon.table.dealOrder; 
	}

	var result = checkHands(order);

	if (!result) {
		returnCards();
		newDealButton.removeAttribute('disabled');
	} else if (result === 'Banker') {
		returnCards();
		newShuffleButton.removeAttribute('disabled');
	} else {
		var newBanker = pontoon.players.lookup(result);
		statusDisp.innerHTML += ' | New banker - ' + newBanker.name;
		document.getElementById( 'player_' + newBanker.id ).className = 'banker';
		document.getElementById( 'player_' + pontoon.table.banker ).className = '';
		returnCards();
		pontoon.table.banker = result;
		pontoon.table.setDealOrder();
		newShuffleButton.removeAttribute('disabled');
	}
});

$.subscribe('Twist', function(e, id, buy) {
	var hand = pontoon.players.lookup(id).hand;
	displayHand([id]);

	if (buy) {
		displayBet(id);
		console.log('Buy one: ' + hand.name);
	} else {
		document.getElementById('buy-'+id).setAttribute('disabled', true);
		console.log('Twist: ' + hand.name);
	}
	
	if (hand.value >= 15) { document.getElementById('stick-'+id).removeAttribute('disabled'); }
	else { document.getElementById('stick-'+id).setAttribute('disabled', true); }

	if (id === pontoon.table.banker) {
		if (hand.cards.length === 5 || hand.state === 'Bust') {
			$.publish('gameFinished', id);
		} else if (hand.value === 21 && hand.state === 'Soft') {

		} else if (hand.name === '21') {
			$.publish('gameFinished', id);
		}
	} else {
		if (hand.cards.length === 5 || hand.state === 'Bust') {
			$.publish('turnFinished', id);
		} else if (hand.value === 21 && hand.state === 'Soft') {

		} else if (hand.name === '21') {
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