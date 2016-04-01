'use strict';
var cutVals = new Dictionary({ // Pass in as part of config obj? Card vals specific to game, aces high/low etc.
		"A": 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13
	}),
	cardVals = new Dictionary({
		"A": 11, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 10, "Q": 10, "K": 10
	});


// DICTIONARY CONSTRUCTOR
function Dictionary(startValues) {
	this.values = startValues || {};
}

Dictionary.prototype.store = function(name, value) {
	return this.values[name] = value;
}

Dictionary.prototype.lookup = function(name) {
	return this.values[name];
}

Dictionary.prototype.contains = function(name, obj) {
	var obj = obj ? obj : this.values;
	return Object.prototype.propertyIsEnumerable.call(obj, name);
}

Dictionary.prototype.each = function(action) {
	forEachIn(this.values, action);
}


// CARD CONSTRUCTOR
function Card(rank, suit, val) {
	this.rank = rank;
	this.suit = suit;
	if (val) { this.value = val; }
}

Card.prototype.name = function() {
	return this.rank + this.suit;
}

Card.prototype.setVal = function(val) {
	this.value = val;
}


// DECK CONSTRUCTOR
function Deck(config) {
	this.suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
	this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
	this.cards = new Array(this.suits.length * this.ranks.length);
	this.cardVals = config.cardVals;
	this.buildDeck();
}

Deck.prototype.cardAt = function(pos) {
	return this.cards[pos];
}

Deck.prototype.setCardAt = function(pos, card) {
	this.cards[pos] = card;
}

Deck.prototype.buildDeck = function() {
	for (var s = 0; s < this.suits.length; s++) {
		for (var r = 0; r < this.ranks.length; r++) {
			this.setCardAt( s * this.ranks.length + r, new Card(this.ranks[r], this.suits[s], this.cardVals.lookup(this.ranks[r])) );
		}
	}
}

Deck.prototype.shuffle = function(amount) {
	var amount = amount ? amount : 7,
		len = this.cards.length;

	for (var i = 0; i < amount; i++) {
		var	split = this.splitPack(len),
			deckL = this.cards,
			deckR = deckL.splice( split, len - split ),
			shuffledDeck = [];

		for (var j = 0; j < len;) {
			if (deckL.length) { riffle( deckL, randomInt(1,2) ) }
			if (deckR.length) { riffle( deckR, randomInt(1,2) ) }

			function riffle(side, num) {
				var num = (num > side.length) ? --num : num;
				for (var k = 0; k < num; k++) {
					shuffledDeck.push( side.shift() );
					j++;
				}
			}
		}

		this.cards = shuffledDeck;
	}
}

Deck.prototype.splitPack = function(len) {
	return randomInt( Math.ceil(len / 2) - 3, Math.ceil(len / 2) + 3 );
}

Deck.prototype.cut = function() {
	return this.cardAt( randomInt(0, this.cards.length-1) );
}

Deck.prototype.deal = function(order, amount) {
	do {
		for (var i = 0, len = order.length; i < len; i++) {
			var player = pontoon.players.lookup(order[i]);
			player.hand.add( this.cards.pop(), order[i] );
		}
		amount--;
	} while (amount)
}

Deck.prototype.returnToDeck = function(hand) {
	for (var i = 0, len = hand.length; i < len; i++) {
		this.cards.unshift(hand[i]);
	}
}


// PONTOON CONSTRUCTOR
function Pontoon(loStake, hiStake) {
	this.loStake = loStake;
	this.hiStake = hiStake;
	this.table = new Table();
	this.players = new Dictionary();
	this.gameState;
}

Pontoon.prototype.setStakes = function(lo, hi) {
	this.loStake = lo;
	this.hiStake = hi;
}

Pontoon.prototype.setState = function(state) {
	this.gameState = state;
	$.publish(this.gameState);
}


// TABLE CONSTRUCTOR
function Table() {
	this.dealOrder = [];
	this.playerTurn = [];
	this.banker;
	this.state;
	this.hands = [];

	this.deck = new Deck({
		cardVals: cardVals
	});
}

Table.prototype.addToTable = function(name) {
	var id = 'P_'+this.dealOrder.length;
	this.dealOrder.push(id);
	pontoon.players.store( id, new Player(id, name) );
	return id;
}

Table.prototype.determineDealer = function() {
	var cutCards = [];
	while (!cutCards.length) {
		for (var i = 0, len = this.dealOrder.length; i < len; i++) {
			var cutCard = pontoon.players.lookup(this.dealOrder[i]).cutDeck();
			cutCards.push( cutVals.lookup(cutCard.rank) );
		}
		if ( findDuplicates(cutCards) ) { cutCards = []; }
	}
	return this.banker = 'P_'+highestCard(cutCards); // use .reduce()?
}

Table.prototype.setDealOrder = function() {
	var order = [],
	bankerIdx = this.dealOrder.indexOf(this.banker);

	if (this.dealOrder.indexOf(this.banker) !== this.dealOrder.length -1) {
		var start = this.dealOrder.splice(bankerIdx+1);
		this.dealOrder = start.concat(this.dealOrder);
	}
	return this.dealOrder;
}

Table.prototype.deal = function() {
	this.deck.deal(this.dealOrder);
}

Table.prototype.turns = function() {
	if (this.playerTurn.length === 0) {
		this.playerTurn = [ this.dealOrder[0] ];
	} else if (this.playerTurn[0] === this.banker) {
		pontoon.setState('gameFinished');
	}
	else {
		var idx = this.dealOrder.indexOf(this.playerTurn[0]) + 1;
		this.playerTurn = [this.dealOrder[idx]];
	}
	
	return this.playerTurn[0];
}


// PLAYER CONSTRUCTOR
function Player(id, name, chips) { 	
	this.name = name;
	this.id = id;
	this.chips = chips ? chips : 5000;
	this.hand = new Hand();
	this.bets = [];
}

Player.prototype.cutDeck = function() {
	return this.cutCard = pontoon.table.deck.cut();
}

Player.prototype.bet = function(val) {
	this.chips -= val;
	this.bets.push(val);
}

Player.prototype.betTotal = function() {
	return this.bets.reduce(sum, 0);
}

Player.prototype.splitHand = function() {
	this.splitHand = new Hand( this.hand.cards.pop() );
	// this.splitBets.push(this.bets[0]);
	// $.publish('splitHand', this.id);
}

Player.prototype.buy = function(val) {
	this.bet(val);
	this.twist();
}

Player.prototype.twist = function() {
	pontoon.table.deck.deal([this.id]);
}

Player.prototype.stick = function() {
	return this.stick = this.hand.status;
}

Player.prototype.bust = function() {
	pontoon.table.deck.returnToDeck(this.hand.cards);
	this.hand = new Hand();
	pontoon.players.lookup(pontoon.table.banker).chips += this.betTotal();
	this.bets = [];
}

Player.prototype.returnCards = function() {
	pontoon.table.deck.returnToDeck(this.hand.cards);
	this.hand = new Hand();	
}


// HAND CONSTRUCTOR
function Hand(card) {
	this.cards = card ? [card] : [];
	this.value;
	this.state;
	this.name;
}

Hand.prototype.add = function(card, id) {
	this.cards.push(card);
	this.total(id);
}

Hand.prototype.total = function(id) { // Needs refactoring
	var handVal = [],
		handLen = this.cards.length,
		aces = 0,
		total;

	for (var i = 0; i < handLen; i++) {
		handVal.push(this.cards[i].value);
		if (this.cards[i].rank == 'A') { aces++; }
	}

	total = handVal.reduce(sum, 0);

	if (handLen < 2) {
		this.value = total;
		this.name = total.toString();

		if (id === pontoon.table.banker) {
			pontoon.setState('firstDeal');
		}
	}

	else if (handLen === 2) {
		if (total === 21) {
			this.value = total;
			this.name = 'Pontoon';
		} else if (this.cards[0].rank === this.cards[1].rank) {
			if (aces) {
				this.value = hasAces();
				this.name = total.toString();
			} else {
				this.value = total;
				this.name = total.toString();
			}
		} else if (aces) {
			this.value = total;
			this.name = total.toString();
			this.state = '(Soft)';
		} else {
			this.value = total;
			this.name = total.toString();
		}

		if (id === pontoon.table.banker) {
			pontoon.setState( 'dealFinished' );
		}
	}

	else if (handLen > 2) {
		if (total > 21 && aces === 0) {
			this.value = total;
			this.state = 'Bust';
		} 
		else if (total >= 21 && aces) {
			this.value = hasAces();
			this.name = total.toString();
			if (this.value > 21) {
				this.state = 'Bust';
			} else if (handLen === 5) {
				this.state = '';
				this.name = '5 card trick';
			} else if (this.value === 21) {
				this.name = '21';
				this.state = '';
			}
		} 
		else if (total < 21 && aces) {
			this.value = total;
			this.name = total.toString();
			this.state = '(Soft)';
		} 
		else if (total <= 21 && handLen === 5) {
			this.state = '';
			this.name = '5 card trick';
		}
		else if (total === 21) {
			this.value = total;
			if (handLen < 5  && aces === 0) {
				this.name = '21';
				this.state = '';
			} else if (handLen < 5 && aces) {
				this.name = total.toString();
			}
		} else {
			this.value = total;
			this.state = '';
			this.name = total.toString();
		}
	}

	function hasAces() {
		for (var i = 1; i <= aces; i++) {
			if ( (total - (10 * i)) <= 21 ) {
				if (i === 1 && aces === 2) {
					pontoon.players.lookup(id).hand.state = '(Soft)';
				} else {
					pontoon.players.lookup(id).hand.state = '(Hard)';
				}
				return total -= (10 * i);
			}
		}
		return total;
	}
}


// UTILITY FUNCTIONS
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function sum(acc, item) {
	return acc + item;
}

function forEach(arr, action) {
	for (var i = 0, len = arr.length; i < len; i++) {
		action(arr[i]);
	}
}

function forEachIn(object, action) {
	for (var property in object) {
		if (Object.prototype.hasOwnProperty.call(object, property)) {
			action(property, object[property]);
		}
	}
}

function findDuplicates(arr) {
	var newArr = arr.slice().sort();
	for (var i = 0, len = arr.length; i < len; i++) {
		if (i > 0 && newArr[i] === newArr[i-1]) { return true; }
	}
	return false;
}

function highestCard(arr) { // Returns index of highest value: use .reduce()?
	var max = arr[0], idx = 0;
	for (var i = 1, len = arr.length; i < len; i++) {
	    if (arr[i] > max) {
	        idx = i;
	        max = arr[i];
	    }
	}
	return idx;
}