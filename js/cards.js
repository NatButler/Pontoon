'use strict';
var deck, table, 
	players = new Dictionary(),
	cutVals = new Dictionary({ // Pass in as part of config obj? Card vals specific to game, aces high/low etc.
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


// DECK CONSTRUCTOR
function Deck() {
	this.suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
	this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
	this.cards = new Array(this.suits.length * this.ranks.length);
	this.buildDeck();
	// return this.cards;
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
			this.setCardAt( s * this.ranks.length + r, new Card(this.ranks[r], this.suits[s], cardVals.lookup(this.ranks[r])) );
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
			var player = players.lookup(order[i]);
			player.hand.add( this.cards.pop() );
		}
		amount--;
	} while (amount)

	$.publish('dealt', order);
}

Deck.prototype.returnToDeck = function(cards) {
	for (var i = 0, len = cards.length; i < len; i++) {
		this.cards.unshift(cards[i]);
	}
}


// TABLE CONSTRUCTOR
function Table(loStake, hiStake) {
	this.loStake = loStake;
	this.hiStake = hiStake;
	this.dealOrder = [];
	this.banker;
	this.pot;

	deck = new Deck(); // Pass through config to new Deck. Why declare deck here?
}

Table.prototype.addToTable = function(name) {
	var id = 'P_'+this.dealOrder.length;
	this.dealOrder.push(id);
	players.store( id, new Player(id, name) );
	return id;
}

Table.prototype.setStakes = function(lo, hi) {		// Probably not necessary as set on new Table
	this.loStake = lo;
	this.hiStake = hi;
}

Table.prototype.determineDealer = function() {
	var cutCards = [];
	while (!cutCards.length) {
		for (var i = 0, len = this.dealOrder.length; i < len; i++) {
			var cutCard = players.lookup(this.dealOrder[i]).cutDeck();
			cutCards.push( cutVals.lookup(cutCard.rank) );
		}
		if ( findDuplicates(cutCards) ) { cutCards = []; }
	}
	return this.banker = 'P_'+highestCard(cutCards);
}

Table.prototype.setDealOrder = function() {
	var order = [];
	for (var i = 0, len = this.dealOrder.length; i < len; i++) {
		if (this.dealOrder[i] != this.banker) { order.push(this.dealOrder[i]); }
	}
	order.push(this.banker);
	return this.dealOrder = order;
}

Table.prototype.deal = function() {
	deck.deal(this.dealOrder);
}

Table.prototype.compareHands = function() {
	// Compare to bankers hand

}

Table.prototype.pot = function() {

}


// PLAYER CONSTRUCTOR
function Player(id, name, chips) { 	
	// Need to deal with split hands - new player or new hand? Perhaps hands should be associated with players through IDs and then handle hands separately. Or indicate which hand is being played
	this.name = name;
	this.id = id;
	this.chips = chips ? chips : 5000;
	this.hand = new Hand();
	this.bets = [];
}

Player.prototype.cutDeck = function() {
	return this.cutCard = deck.cut();
}

Player.prototype.bet = function(val) {
	this.chips -= val;
	this.bets.push(val);
}

Player.prototype.splitHand = function() {
	this.splitHand = new Hand( this.hand.cards.pop() );
	this.splitBets.push(this.bets[0]);
}

Player.prototype.buy = function() {

}

Player.prototype.twist = function() {
	deck.deal([this.id]);
}

Player.prototype.stick = function() {
	// Return hand total, state, name?
}

Player.prototype.bust = function() {
	deck.returnToDeck(this.hand.cards);
	this.hand = newHand();
}


// HAND CONSTRUCTOR
function Hand(card) {
	this.cards = card ? [card] : [];
	this.value = 0;
	this.state; // Soft / hard / bust
}

Hand.prototype.add = function(card) {
	this.cards.push(card);
	$.publish('handUpdate', this);
}

Hand.prototype.check = function() {
	// Return total value and state of hand.

}

Hand.prototype.total = function() { // Needs completing
	var handVal = [];

	for (var i = 0; i < this.cards.length; i++) {
		handVal.push(this.cards[i].value);
	}

	if (this.state === 'Bust') {
		return this.state;
	} else {
		return handVal.reduce(sum, 0).toString();
	}
}

Hand.prototype.status = function() { 					// Needs completing
	if (this.cards.rank == 'A' && this.total < 10) {
		this.state = 'Soft';
	}
}


// HELPER FUNCTIONS
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

function highestCard(arr) { // Returns index of highest value
	var max = arr[0], idx = 0;
	for (var i = 1, len = arr.length; i < len; i++) {
	    if (arr[i] > max) {
	        idx = i;
	        max = arr[i];
	    }
	}
	return idx;
}