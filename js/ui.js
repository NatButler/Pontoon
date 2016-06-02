'use strict';
var pontoon, newShuffleButton, newDealButton, addPlayerButton, cutDeckButton, dealButton, userTemplate, playersDiv, stakesElem, bankerDisplay, twistButtons, stickButtons, buyButtons, betButtons, stakeRanges, statusDisp;

function init() {
	cache();
	bindEvents();

	pontoon = new Game({
		loStake: 50,
		hiStake: 100,
		cardVals: new Dictionary({ "A": 11, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 10, "Q": 10, "K": 10 })
	});
	pontoon.table.deck.shuffle(11);
	stakesElem.innerHTML = pontoon.loStake + ' / ' + pontoon.hiStake;

	// Pass in players as part of config object?
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
	betButtons = document.getElementsByClassName('place-bet');
	stakeRanges = document.getElementsByClassName('stake-range');
}

function bindEvents() {
	addPlayerButton.addEventListener('click', addPlayer);
	cutDeckButton.addEventListener('click', cutForBanker);
	dealButton.addEventListener('click', deal);
	newShuffleButton.addEventListener('click', newShuffle);
	newDealButton.addEventListener('click', newDeal);
}

function bindTurnEvents() {
	registerEventHandlers(twistButtons, 'click', twist);
	registerEventHandlers(stickButtons, 'click', stick );
	registerEventHandlers(buyButtons, 'click', buy);
	registerEventHandlers(betButtons, 'click', bet);
	registerEventHandlers(stakeRanges, 'change', updateStakeRange);
}

function addPlayer(name) {
	var name = name.target ? prompt('Enter player name.') : name;
	if (!name) { }
	else if (name === '') { addPlayer(); } 
	else { displayPlayer( pontoon.addPlayer(name) ); }

	if (pontoon.table.dealOrder.length === 8) { addPlayerButton.setAttribute('disabled', true); }
}

function displayPlayer(player) {
	var list = '';
	list += userTemplate.replace(/{{id}}/g, player.id)
						.replace(/{{name}}/i, player.name)
						.replace(/{{chips}}/i, player.chips)
						.replace(/{{loStake}}/g, pontoon.loStake)
						.replace(/{{hiStake}}/i, pontoon.hiStake);
	playersDiv.innerHTML += list;
}

function updateStakeRange() {
	var output = this.nextElementSibling;
    output.value = this.value;
}

function displayCut() {
	pontoon.players.each(function(id, player) {
		var cutSpan = document.getElementById( 'cut_' + id );
		cutSpan.className += ' ' + player.cutCard.suit;
		cutSpan.innerHTML = charMap[player.cutCard.name()];
	});
	$('.cut').fadeOut(1500);
}

function displayCard(id, hand) {
	var handSpan = document.getElementById('hand_' + id);

	if (pontoon.table.turn !== pontoon.table.banker && id === pontoon.table.banker) {
		handSpan.innerHTML += '<span>' + charMap['Reverse'] + '</span>';
		console.log(id + ': ' + '(Banker)' );
	}
	else {
		var handNameSpan = document.getElementById('hand-name_' + id),
			handStateSpan = document.getElementById('hand-state_' + id),
			handLen = hand.cards.length -1,
			card = hand.cards[handLen].name(),
			handState = hand.state,
			handName = hand.name;

		handSpan.innerHTML += '<span class=" ' + hand.cards[handLen].suit + '">' + charMap[card] + '</span>';
		handNameSpan.innerHTML = (hand.value > 21) ? '' : handName;

		if (handState) { handStateSpan.innerHTML = handState; } 
		else { handStateSpan.innerHTML = ''; }
		
		if (!pontoon.table.turn) { console.log(id + ': ' + handName); }
	}
}

function revealBankersHand(id) {
	var hand = pontoon.players.lookup(id).hand,
		handSpan = document.getElementById('hand_' + id),
		handNameSpan = document.getElementById('hand-name_' + id),
		handStateSpan = document.getElementById('hand-state_' + id);

	handSpan.innerHTML = '';
	for (var i = 0, len = hand.cards.length; i < len; i++) {
		var card = hand.cards[i].name();
		handSpan.innerHTML += '<span class=" ' + hand.cards[i].suit + '">' + charMap[card] + '</span>';
	}
	handNameSpan.innerHTML = (hand.value > 21 && hand.state !== '(Soft)') ? '' : hand.name;

	if (hand.state) { handStateSpan.innerHTML = hand.state; } 
	else { handStateSpan.innerHTML = ''; }

	if (len > 1) { console.log(id + ': ' + hand.name); }
}

function displayBet(id) {
	var player = pontoon.players.lookup(id);
	document.getElementById('stake-total_'+id).innerHTML = (player.betTotal() === 0) ? '' : player.betTotal();
	document.getElementById('chips_'+id).innerHTML = player.chips;

	if (!pontoon.table.turn && pontoon.players.lookup(pontoon.table.banker).hand.name != 'Pontoon') { checkBets(); }
}

function deal() {
	pontoon.table.deal();
	dealButton.setAttribute('disabled', true);
}

function bet() {
	var id = this.id.split('-'),
		betValue = document.getElementById('stake-'+id[1]),
		betValueOutput = betValue.nextElementSibling.innerHTML = '';
	
	pontoon.players.lookup(id[1]).bet(+betValue.value);
	displayBet(id[1]);

	if (pontoon.table.turn) { 
		pontoon.table.deck.deal([id[1]]);
		console.log('Buy one: ' + pontoon.players.lookup(id[1]).hand.name + ' - ' + betValue.value);
	}
	else { console.log(id[1] + ' placed a bet of ' + betValue.value); }

	this.setAttribute('disabled', true);
	betValue.setAttribute('disabled', true);
	betValue.value = betValue.min;
}

function buy() {
	var id = pontoon.table.turn,
		player = pontoon.players.lookup(id),
		betButton = document.getElementById('bet-'+id),
		stakeRange = document.getElementById('stake-'+id),
		twistButton = document.getElementById('twist-'+id),
		stickButton = document.getElementById('stick-'+id);

	if (player.hand.cards.length === 2) {
		stakeRange.min = player.bets[0];
		if (player.bets[0] * 2 > player.chips) { stakeRange.max = player.chips; }
		else { stakeRange.max = player.bets[0] * 2; }
	} else {
		if (player.bets[1] > player.chips) { stakeRange.max = player.chips; }
		else { stakeRange.max = player.bets[1]; }
	}

	this.setAttribute('disabled', true);
	twistButton.setAttribute('disabled', true);
	stickButton.setAttribute('disabled', true);
	betButton.removeAttribute('disabled');
	stakeRange.removeAttribute('disabled');
	stakeRange.focus();
}

function twist() {
	var id = this.id.split('-');
	pontoon.table.deck.deal([id[1]]);
	document.getElementById('buy-'+id[1]).setAttribute('disabled', true);
	console.log('Twist: ' + pontoon.players.lookup(id[1]).hand.name);
}

function stick() {
	console.log('Stick: ' + pontoon.players.lookup(pontoon.table.turn).hand.name);
	$.publish('turnFinished', pontoon.table.turn);
}

function bust(id) {
	var player = pontoon.players.lookup(id);
	pontoon.players.lookup(pontoon.table.banker).chips += player.betTotal();
	pontoon.table.deck.returnToDeck(player.hand.cards);
	player.bust();
}

function checkBets() {
	var bets = 0;
	for (var i = 0; i < pontoon.table.dealOrder.length; i++) {
		if ( pontoon.players.lookup(pontoon.table.dealOrder[i]).bets.length > 0 ) { bets++; }
	}
	if (bets === pontoon.table.dealOrder.length -1) { betsFinished(); }
}

function returnCards() {
	pontoon.players.each(function(id, player) { 
		pontoon.table.deck.returnToDeck(player.hand.cards);
		player.hand = new Hand();
	});
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
	dealButton.focus();	
	pontoon.table.turn = undefined;
	pontoon.table.hands = [];
	statusDisp.innerHTML = '';
}

function resetHandDisp(order) {
	pontoon.players.each(function(id, player) {
		var handSpan = document.getElementById('hand_' + id),
			stakeRange = document.getElementById('stake-'+id);
		handSpan.innerHTML = '';
		handSpan.removeAttribute('style');

		if (player.chips < pontoon.loStake) { pontoon.table.playerBroke(id); }

		stakeRange.min = pontoon.loStake;
		if (player.chips < pontoon.hiStake && player.chips >= pontoon.loStake) { stakeRange.max = player.chips; }
		else { stakeRange.max = pontoon.hiStake; }
		stakeRange.value = stakeRange.min;

		document.getElementById(id).removeAttribute('style');
		document.getElementById('hand-name_' + id).innerHTML = '';
		document.getElementById('hand-state_' + id).innerHTML = '';
	});
}

function resetPlayerDisplay(id) {
	document.getElementById('controls_'+id).removeAttribute('style');
	document.getElementById('twist-'+id).setAttribute('disabled', true);
	document.getElementById('buy-'+id).setAttribute('disabled', true);
	document.getElementById('stick-'+id).setAttribute('disabled', true);
}

function gameStart() {
	console.log('Game started');
	pontoon.table.setDealOrder();
	cutDeckButton.setAttribute('disabled', true);
	addPlayerButton.setAttribute('disabled', true);
	dealButton.removeAttribute('disabled');
	dealButton.focus();
}

function firstDeal() {
	console.log('First deal: initial stakes');
	bindTurnEvents();
	initialStakes();
}

function initialStakes() {
	statusDisp.innerHTML = 'First deal: place bets';
	for (var i = 0; i < betButtons.length; i++) {
		var id = betButtons[i].id.split('-');
		if (id[1] !== pontoon.table.banker && id[1].indexOf(pontoon.table.dealOrder)) { betButtons[i].removeAttribute('disabled'); stakeRanges[i].removeAttribute('disabled'); }
		if (id[1] === pontoon.table.dealOrder[0]) { betButtons[i].focus(); }
	}
}

function betsFinished() {
	console.log('Bets finsihed');
	statusDisp.innerHTML = 'Bets placed: turns';
	dealButton.removeAttribute('disabled');
	dealButton.focus();
}

function dealFinished() {
	dealButton.setAttribute('disabled', true);
	console.log('Deal finished');
	if (pontoon.players.lookup(pontoon.table.banker).hand.name === 'Pontoon') {
		pontoon.table.turn = pontoon.table.banker;
		revealBankersHand(pontoon.table.banker);
		$.publish('gameFinished');
	}
	else { $.publish('playerTurn'); }
}


// SUBSCRIPTIONS
$.subscribe('deal', function(e, id, hand) {
	var delay = (pontoon.table.turn) ? 0 : pontoon.table.dealOrder.indexOf(id) * 300;
	setTimeout(function() { 
		displayCard(id, hand);
		if (id === pontoon.table.banker) { 
			if (hand.cards.length == 1) { firstDeal(); }
			if (hand.cards.length == 2) { dealFinished(); }
		}
	}, delay);

	if (pontoon.table.turn && hand.cards.length > 2) { twisted(id, hand); }
});

$.subscribe('playerTurn', function() {
	var id = pontoon.table.turns(),	
		player = pontoon.players.lookup(id);

	statusDisp.innerHTML = 'Player turn: ' + player.name;
	if (id === pontoon.table.banker) { console.log('Turn: banker'); }
	else { console.log('Turn: '+id); }

	if (id === pontoon.table.banker && pontoon.table.hands.length === 0) {
		statusDisp.innerHTML = 'New deal';
		pontoon.table.deck.returnToDeck(player.hand.cards);
		player.hand = new Hand();
		newDealButton.removeAttribute('disabled');
		newDealButton.focus();
		return;
	} 
	else if (id === pontoon.table.banker) { revealBankersHand(id); }

	if (player.hand.name !== 'Pontoon') {
		document.getElementById('controls_'+id).style.background = '#E5E5E5'; // FEFFD2 FCFCFC activeborder 76A0C7 52708B D1D6DB
		document.getElementById('controls_'+id).style.outline = '1px solid #E2E2E2'; // E4E5A2
		var twistButton = document.getElementById('twist-'+id);
		twistButton.removeAttribute('disabled');
		twistButton.focus();
		if (id != pontoon.table.banker && player.chips > pontoon.loStake) { document.getElementById('buy-'+id).removeAttribute('disabled'); }
		if (player.hand.value >= 15) { document.getElementById('stick-'+id).removeAttribute('disabled'); }
	} 
	else { $.publish('turnFinished', id); }

});

$.subscribe('turnFinished', function(e, id) {
	resetPlayerDisplay(id);

	if (id != pontoon.table.banker) {
		if (pontoon.players.lookup(id).hand.state != 'Bust') { pontoon.table.addHand(id); } 
		else {
			bust(id);
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
	} 
	else { var order = pontoon.table.dealOrder; }

	var result = checkHands(order);

	if (!result) {
		returnCards();
		newDealButton.removeAttribute('disabled');
		newDealButton.focus();
	} else if (result === 'Banker') {
		returnCards();
		newShuffleButton.removeAttribute('disabled');
		newShuffleButton.focus();
	} else {
		var newBanker = pontoon.players.lookup(result);
		statusDisp.innerHTML += ' | New banker - ' + newBanker.name;
		document.getElementById( 'player_' + newBanker.id ).className = 'banker';
		document.getElementById( 'player_' + pontoon.table.banker ).className = '';
		returnCards();
		pontoon.table.banker = result;
		pontoon.table.setDealOrder();
		newShuffleButton.removeAttribute('disabled');
		newShuffleButton.focus();
	}
});


// UTILITY FUNCTIONS
function registerEventHandlers(nodes, event, handler) {
	forEach(nodes, function(node) { node.addEventListener(event, handler); });
}

init();