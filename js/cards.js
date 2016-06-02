'use strict';

// DICTIONARY CLASS
class Dictionary {
	constructor(startValues) {
		this.values = startValues || {};
	}

	store(name, value) {
		return this.values[name] = value;
	}

	lookup(name) {
		return this.values[name];
	}

	contains(name, val) {
		var val = val ? this.values.val : this.values;
		return Object.prototype.propertyIsEnumerable.call(val, name);
	}

	each(action) {
		forEachIn(this.values, action);
	}
}


// CARD CLASS
class Card {
	constructor(rank, suit, cutVal, val) {
		this.rank = rank;
		this.suit = suit;
		this.value = val;
		this.cutVal = cutVal;
	}

	name() {
		return this.rank + this.suit;
	}
}


// DECK CLASS
class Deck {
	constructor(config) {
		this.suits = ['C', 'D', 'H', 'S'];
		this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
		this.cards = new Array(this.suits.length * this.ranks.length);
		this.cutVals = new Dictionary({ "A": 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13 });
		this.cardVals = config.cardVals;
		this.buildDeck();
	}

	cardAt(pos) {
		return this.cards[pos];
	}

	setCardAt(pos, card) {
		this.cards[pos] = card;
	}

	buildDeck() {
		for (var s = 0; s < this.suits.length; s++) {
			for (var r = 0; r < this.ranks.length; r++) {
				this.setCardAt( 
					s * this.ranks.length + r, 
					new Card(
						this.ranks[r],
						this.suits[s],
						this.cutVals.lookup(this.ranks[r]),
						this.cardVals.lookup(this.ranks[r])
					) 
				);
			}
		}
	}

	shuffle(amount) {
		var amount = amount ? amount : 7,
			len = this.cards.length;

		for (var i = 0; i < amount; i++) {
			var	split = this.splitPoint(len),
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

	splitPoint(len) {
		return randomInt( Math.ceil(len / 2) - 3, Math.ceil(len / 2) + 3 );
	}

	cut() {
		return this.cardAt( randomInt(0, this.cards.length-1) );
	}

	deal(order, amount) {
		do {
			for (var i = 0, len = order.length; i < len; i++) {
				var player = pontoon.players.lookup(order[i]);
				player.hand.add( this.cards.pop(), order[i] );
			}
			amount--;
		} while (amount)
	}

	returnToDeck(hand) {
		forEach(hand, card => this.cards.unshift(card) );
	}
}


// GAME CLASS
class Game {
	constructor(config) {
		this.loStake = config.loStake;
		this.hiStake = config.hiStake;
		this.table = new Table(config.cardVals);
		this.players = new Dictionary();
		// this.rules; winning hands passed in config
	}

	// setStakes(lo, hi) {
	// 	this.loStake = lo;
	// 	this.hiStake = hi;
	// }

	addPlayer(name) {
		var numPlayers = this.table.dealOrder.length;
		if (numPlayers < 8) {
			var id = 'P_' + numPlayers;
			this.table.addToTable(id);
			return this.players.store(id, new Player(id, name));
		} else {
			throw new Error('8 players max');
		}
	}

	determineDealer() {
		var cutCards = [];
		while (!cutCards.length) {
			this.players.each(function(id, player) { 
				cutCards.push( player.cutDeck() ); 
			});
			if ( findDuplicates(cutCards) ) { cutCards = []; }
		}
		return this.table.banker = 'P_' + highestCard(cutCards); // use .reduce()?
	}
}


// TABLE CLASS
class Table {
	constructor(cardVals) {
		this.dealOrder = [];
		this.turn;
		this.banker;
		this.hands = [];
		this.deck = new Deck({
			cardVals: cardVals
		});
	}

	addToTable(id) {
		return this.dealOrder.push(id);
	}

	playerBroke(id) {
		var idx = this.dealOrder.indexOf(id);
		this.dealOrder.splice(idx, 1);
	}

	setDealOrder() {
		var order = [],
			bankerIdx = this.dealOrder.indexOf(this.banker);

		if (this.dealOrder.indexOf(this.banker) !== this.dealOrder.length -1) {
			var start = this.dealOrder.splice(bankerIdx+1);
			this.dealOrder = start.concat(this.dealOrder);
		}
		return this.dealOrder;
	}

	deal() {
		this.deck.deal(this.dealOrder);
	}

	turns() {
		if (!this.turn) { this.turn = this.dealOrder[0]; } 
		else {
			var idx = this.dealOrder.indexOf(this.turn) + 1;
			this.turn = this.dealOrder[idx];
		}
		return this.turn;
	}

	addHand(id) {
		this.hands.push(id);
	}
}


// PLAYER CLASS
class Player {
	constructor(id, name, chips) {
		this.name = name;
		this.id = id;
		this.chips = chips ? chips : 5000;
		this.hand = new Hand();
		this.bets = [];
	}

	cutDeck() {
		this.cutCard = pontoon.table.deck.cut();
		return this.cutCard.cutVal;
	}

	bet(val) {
		this.chips -= val;
		this.bets.push(val);
		return this.betTotal();
	}

	betTotal() {
		return this.bets.reduce(sum, 0);
	}

	bust() {
		this.hand = new Hand();
		this.bets = [];
	}
}


// HAND CLASS
class Hand {
	constructor(card) {
		this.cards = card ? [card] : [];
		this.value;
		this.state;
		this.name;
	}

	add(card, id) {
		this.cards.push(card);
		this.total(id);
		$.publish('deal', [id, this]);
	}

	total(id) { // Needs refactoring
		var handVal = 0,
			handLen = this.cards.length,
			aces = 0;

		for (var i = 0; i < handLen; i++) {
			if (this.cards[i].rank == 'A') { aces++; }
			handVal += this.cards[i].value;
		}

		if (handLen < 2) {
			this.value = handVal;
			this.name = handVal.toString();
		}

		else if (handLen === 2) {
			if (handVal === 21) {
				this.value = handVal;
				this.name = 'Pontoon';
			} 
			else if (this.cards[0].rank === this.cards[1].rank) { // Redundent without split hand functionality, though bug for 2 aces = 22 if block not used
				if (aces) {
					this.value = hasAces(this);
					this.name = handVal.toString();
				} 
				else {
					this.value = handVal;
					this.name = handVal.toString();
				}
			} 
			else if (aces) {
				this.value = handVal;
				this.name = handVal.toString();
				this.state = '(Soft)';
			} 
			else {
				this.value = handVal;
				this.name = handVal.toString();
			}
		}

		else if (handLen > 2) {
			if (handVal > 21 && aces === 0) {
				this.value = handVal;
				this.state = 'Bust';
				this.name = 'Bust';
			} 
			else if (handVal >= 21 && aces) {
				this.value = hasAces(this);
				this.name = handVal.toString();
				if (this.value > 21) {
					this.state = 'Bust';
					this.name = 'Bust';
				} 
				else if (handLen === 5) {
					this.state = '';
					this.name = '5 card trick';
				} 
				else if (this.value === 21) {
					this.name = '21';
					this.state = '';
				}
			} 
			else if (handVal < 21 && aces) {
				this.value = handVal;
				this.name = handVal.toString();
				this.state = '(Soft)';
			} 
			else if (handVal <= 21 && handLen === 5) {
				this.state = '';
				this.name = '5 card trick';
			}
			else if (handVal === 21) {
				this.value = handVal;
				if (handLen < 5  && aces === 0) {
					this.name = '21';
					this.state = '';
				} 
				else if (handLen < 5 && aces) {
					this.name = handVal.toString();
				}
			} 
			else {
				this.value = handVal;
				this.state = '';
				this.name = handVal.toString();
			}
		}

		function hasAces(hand) {
			for (var i = 1; i <= aces; i++) {
				if ( (handVal - (10 * i)) <= 21 ) {
					if (i === 1 && aces === 2) { hand.state = '(Soft)'; } 
					else { hand.state = '(Hard)'; }
					return handVal -= (10 * i);
				}
			}
			return handVal;
		}
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
		if (Object.prototype.propertyIsEnumerable.call(object, property)) { // Object.prototype.hasOwnProperty.call(object, property)
			action(property, object[property]);
		}
	}
}

function findDuplicates(arr) {
	var newArr = arr.slice().sort();
	for (var i = 0, len = arr.length; i < len; i++) {
		if (i > 0 && newArr[i] === newArr[i-1]) { return true; }
	}
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