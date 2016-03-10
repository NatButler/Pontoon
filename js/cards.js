'use strict';
var deck, table;
var players = new Dictionary();
var cutVals = new Dictionary({
	"A": 14,
 	"2": 2,
 	"3": 3,
	"4": 4,
	"5": 5,
	"6": 6,
	"7": 7,
	"8": 8,
	"9": 9,
	"T": 10,
	"J": 11,
	"Q": 12,
	"K": 13
});
var cardVals = new Dictionary({
	"A": 11,
 	"2": 2,
 	"3": 3,
	"4": 4,
	"5": 5,
	"6": 6,
	"7": 7,
	"8": 8,
	"9": 9,
	"T": 10,
	"J": 10,
	"Q": 10,
	"K": 10
});


// HELPER FUNCTIONS
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function sum(acc, item) {
	return acc + item;
}

function forEach(array, action) {
	for (var i = 0, len = array.length; i < len; i++) {
		action(array[i]);
	}
}

function forEachIn(object, action) {
	for (var property in object) {
		if (Object.prototype.hasOwnProperty.call(object, property)) {
			action(property, object[property]);
		}
	}
}

function dealOrder(banker) {
	var order = [table.playerNames[banker]];
	for (var i = 0, len = table.playerNames.length; i < len; i++) {
		if (i !== banker) { order.unshift(table.playerNames[i]); }
	}
	return order;
}

function findDuplicates(arr) {
	var newArr = arr.slice().sort();
	for (var i = 0; i < arr.length; i++) {
		if (i > 0 && newArr[i] === newArr[i-1]) {
			return true;
		}
	}
	return false;
}

function highestCard(arr) {
	var max = arr[0], index = 0;
	for (var i = 1; i < arr.length; i++) {
	    if (arr[i] > max) {
	        index = i;
	        max = arr[i];
	    }
	}
	return index;
}


// CARD CONSTRUCTOR
function Card(rank, suit, value) {
	this.rank = rank;
	this.suit = suit;
	if (value) { this.value = value; }
}


// DECK CONSTRUCTOR
function Deck() {
	this.suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
	this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
	this.cards = new Array(this.suits.length * this.ranks.length);
	this.buildDeck();
	return this;
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

Deck.prototype.deal = function(order) {
	for (var i = 0; i < order.length; i++) {
		var player = player.lookup(order[i]);
		player.hand.add( this.twist() );

		if ( players.contains(player, 'splitHand') ) {
			console.log('Split hand');
			player.splitHand.add( this.twist() );
			i--;
		}
	}
}

Deck.prototype.twist = function() {
	return this.cards.pop();
}

Deck.prototype.addToDeck = function(hand) {
	for (var i = 0; i < hand.length; i++) {
		this.cards.unshift(hand[i]);
	}
}


// TABLE CONSTRUCTOR
function Table(loStake, hiStake) {
	this.loStake = loStake;
	this.hiStake = hiStake;
	this.playerNames = [];

	deck = new Deck();
}

Table.prototype.addPlayer = function(name) {
	this.playerNames.push( name );
}

Table.prototype.setStakes = function(lo, hi) {		// Probably not be necessary as set when creating new Table()
	this.loStake = lo;
	this.hiStake = hi;
}

Table.prototype.deal = function() {
	deck.deal( dealOrder(this.banker) );
}

Table.prototype.determineBanker = function() {
	var cutCards = [];
	for (var i = 0; i < this.playerNames.length; i++) {
		var cutCard = players.lookup(this.playerNames[i]).cutDeck();
		cutCards.push( cutVals.lookup(cutCard.rank) );
	}
	if ( !findDuplicates(cutCards) ) {
		this.banker = highestCard(cutCards);
		return this.banker;
	} else {
		this.determineBanker();
	}
}

Table.prototype.compareHands = function() {
	// Compare to bankers hand

}


// PLAYER CONSTRUCTOR
function Player(name, id, chips) {
	this.name = name;
	this.id = id;
	this.chips = chips ? chips : 5000;
	this.hand = new Hand();
	this.bet = 0;
}

Player.prototype.cutDeck = function() {
	return this.cutCard = deck.cut();
}

Player.prototype.bet = function(val) {
	this.chips -= val;
	this.bet += val;
}

Player.prototype.splitHand = function() {
	this.splitHand = new Hand( this.hand.cards.pop() );
	// this.bet(this.bet);			// Should be called when splitHand is called
}

Player.prototype.bust = function() {
	deck.addToPack(this.hand.cards);
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
	// this.value += card.value;
}

Hand.prototype.stick = function() {
	// Return hand total, state, name?
}

Hand.prototype.bust = function() {

}

Hand.prototype.check = function() {
	// Return total value and state of hand.

}

Hand.prototype.total = function() { // Return aces high if total <= 21
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


// DICTIONARY CONSTRUCTOR
function Dictionary(startValues) {
	this.values = startValues || {};
}

Dictionary.prototype.store = function(name, value) {
	this.values[name] = value;
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