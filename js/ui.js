'use strict';
var newGameButton, addPlayerButton, cutDeckButton, dealButton, userTemplate, playersDiv, stakesElem;

function init() {
	cache();
	newGameButton.addEventListener('click', gameStart);
}

function cache() {
	stakesElem = document.getElementById('stakes');
	newGameButton = document.getElementById('new-game');
	addPlayerButton = document.getElementById('add-player');
	cutDeckButton = document.getElementById('cut-deck');
	dealButton = document.getElementById('deal');
	playersDiv = document.getElementById('players');
	userTemplate = document.getElementById('user-template').innerHTML.trim();
}

function bindEvents() {
	addPlayerButton.addEventListener('click', addPlayer);
	cutDeckButton.addEventListener( 'click', () => { cutForBanker(); } );
	dealButton.addEventListener('click', () => { deck.deal(table.setDealOrder()); displayHand(); } );
}

function gameStart() {
	table = new Table(50, 500);
	deck.shuffle();

	stakesElem.innerHTML = table.loStake + ' / ' + table.hiStake;

	bindEvents();
}

function addPlayer() {
	var name = prompt('Please enter your name.');
	if (!name) {
		addPlayer();
	} else {
		players.store( name, new Player('name', table.dealOrder.length) );
		table.addPlayer(name);

		displayPlayer(players.lookup(name).id, name, players.lookup(name).chips);
	}

}

function displayPlayer(id, name, chips) {
	var list = '';

	list += userTemplate.replace(/{{id}}/g, id.toString())
						.replace(/{{name}}/i, name)
						.replace(/{{chips}}/i, chips);

	playersDiv.innerHTML += list;
}

function cutForBanker() {
	var banker = table.determineBanker(),
		playerDiv = document.getElementById( banker.toString() );
	
	if (banker || banker === 0) {
		playerDiv.className += ' banker';
		displayCut();
	}
}

function displayCut() {
	for (var i = 0; i < table.dealOrder.length; i++) {
		var player = players.lookup( table.dealOrder[i] ),
			cutSpan = document.getElementById( 'cut_' + player.id.toString() );

		cutSpan.className += ' ' + player.cutCard.suit;
		cutSpan.innerHTML = charMap[player.cutCard.rank + player.cutCard.suit];
	}
}

function displayHand() {
	for (var i = 0; i < table.dealOrder.length; i++) {
		var player = players.lookup(table.dealOrder[i]),
			id = player.id.toString(),
			handLen = player.hand.cards.length -1,
			suit = player.hand.cards[handLen].suit,
			card = player.hand.cards[handLen].rank + suit,
			handSpan = document.getElementById('hand_' + id),
			handTotalSpan = document.getElementById('hand-total_' + id);

			handSpan.innerHTML += '<span class=" ' + suit + '">' + charMap[card] + '</span>';
			handTotalSpan.innerHTML = player.hand.total();
	}
}

function splitHand() {
	// Add new player display (hand) next to original. This hand is played after the original has finished it's turn
	splitHandButton = document.getElementById('split-hand');

}

function checkHand() {

}

init();