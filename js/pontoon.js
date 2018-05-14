function cutForBanker() {
	var banker = pontoon.cutForDealer(),	
			nameDisplay = document.getElementById( 'player_' + banker );

	nameDisplay.className = 'banker';
	bankerDisplay.innerHTML = pontoon.table.players.lookup(banker).name;
	displayCut();

	console.log('Banker: ' + pontoon.table.players.lookup(banker).name + ' cut the highest card');
	gameStart();
}

function deal() {
	pontoon.table.deal();
	dealButton.setAttribute('disabled', true);
}

function bet() {
	var id = this.id.split('-'),
			betValue = document.getElementById('stake-'+id[1]),
			betValueOutput = betValue.nextElementSibling.innerHTML = '';
	
	pontoon.table.players.lookup(id[1]).bet(+betValue.value);
	displayBet(id[1]);

	if (pontoon.table.turn) { 
		pontoon.table.deal([id[1]]);
		console.log('Buy one: ' + pontoon.table.players.lookup(id[1]).hand.name + ' - ' + betValue.value);
	}
	else { console.log(id[1] + ' placed a bet of ' + betValue.value); }

	this.setAttribute('disabled', true);
	betValue.setAttribute('disabled', true);
	betValue.value = betValue.min;
}

function buy() {
	var id = pontoon.table.turn,
			player = pontoon.table.players.lookup(id),
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
	pontoon.table.deal([id[1]]);
	document.getElementById('buy-'+id[1]).setAttribute('disabled', true);
	console.log('Twist: ' + pontoon.table.players.lookup(id[1]).hand.name);
}

function stick() {
	console.log('Stick: ' + pontoon.table.players.lookup(pontoon.table.turn).hand.name);
	$.publish('turnFinished', pontoon.table.turn);
}

function bust(id) {
	var player = pontoon.table.players.lookup(id);
	pontoon.table.players.lookup(pontoon.banker).chips += player.betTotal();
	pontoon.table.deck.returnToDeck(player.hand.cards);
	player.bust();
}

function twisted(id, hand) { // This could possibly be published in cards.js hand.total()
	if (hand.value >= 15) { document.getElementById('stick-'+id).removeAttribute('disabled'); }
	else { document.getElementById('stick-'+id).setAttribute('disabled', true); }

	if (id === pontoon.banker) {
		if (hand.cards.length === 5 || hand.state === 'Bust') { $.publish('gameFinished', id); } 
		else if (hand.value === 21 && hand.state === '(Soft)') { } 
		else if (hand.name === '21') { $.publish('gameFinished', id); }
	}
	else {
		if (hand.cards.length === 5 || hand.state === 'Bust') { $.publish('turnFinished', id); } 
		else if (hand.value === 21 && hand.state === '(Soft)') { } 
		else if (hand.name === '21') { $.publish('turnFinished', id); }		
		else if (pontoon.table.players.lookup(id).bets.length === hand.cards.length -1) {
			if (pontoon.table.players.lookup(id).chips >= document.getElementById('stake-' + id).min) {
				document.getElementById('buy-'+id).removeAttribute('disabled');
			}
			document.getElementById('twist-'+id).removeAttribute('disabled');
		}
	}
}

function checkHand(hand) { // Needs refactoring
	var handVal = 0,
			handLen = hand.cards.length,
			aces = 0;

	for (var i = 0; i < handLen; i++) {
		if (hand.cards[i].rank == 'A') { aces++; }
		handVal += hand.cards[i].value;
	}

	if (handLen < 2) {
		hand.value = handVal;
		hand.name = handVal.toString();
	}

	else if (handLen === 2) {
		if (handVal === 21) {
			hand.value = handVal;
			hand.name = 'Pontoon';
		}
		else if (aces) {
			hand.value = hasAces(hand);
			hand.name = handVal.toString();
		} 
		else {
			hand.value = handVal;
			hand.name = handVal.toString();
		}
	}

	else if (handLen > 2) {
		if (handVal > 21 && !aces) {
			hand.value = handVal;
			hand.state = 'Bust';
			hand.name = 'Bust';
		}
		else if (handVal > 21 && aces) {
			hand.value = hasAces(hand);
			hand.name = handVal.toString();
			if (hand.value > 21) {
				hand.state = 'Bust';
				hand.name = 'Bust';
			}
			else if (handLen === 5) {
				hand.state = '';
				hand.name = '5 card trick';
			}
			else if (hand.value === 21) {
				hand.name = '21';
				hand.state = '';
			}
		}
		else if (handVal < 21 && aces) {
			hand.value = handVal;
			hand.name = handVal.toString();
			hand.state = '(Soft)';
		} 
		else if (handVal <= 21 && handLen === 5) {
			hand.state = '';
			hand.name = '5 card trick';
		}
		else if (handVal === 21) {
			hand.value = handVal;
			hand.name = '21';
			if (handLen < 5 && aces === 0) {
				hand.state = '';
			}
			else if (handLen < 5 && aces) {
				hand.state = '(Soft)';
			}
		}
		else {
			hand.value = handVal;
			hand.state = '';
			hand.name = handVal.toString();
		}
	}

	return hand;

	function hasAces(hand) {
		for (var i = 1; i <= aces; i++) {
			if (handVal <= 21) {
				hand.state = '(Soft)';
			}
			else if ( (handVal - (10 * i)) <= 21 ) {
				if (i === 1 && aces > 1) { hand.state = '(Soft)'; }
				else { hand.state = '(Hard)'; }
				return handVal -= (10 * i);
			}

		}
		return handVal;
	}
}

function checkHands(order) {
	var pontoons,
			banker = pontoon.table.players.lookup(pontoon.banker);

	for (var i = 0, len = order.length; i < len; i++) {
		var player = pontoon.table.players.lookup(order[i]),
				playerDiv = document.getElementById(player.id),
				stake = player.betTotal();
		if (banker.hand.name === 'Pontoon') {
			statusDisp.innerHTML = 'Banker has pontoon';
			document.getElementById(banker.id).style.background = '#EFFFF0';
			document.getElementById('hand_' + player.id).style.opacity = '0.3';
			banker.chips += stake;
			if (!pontoons) { pontoons = 'Banker'; }
		}
		else if (banker.hand.name === 'Bust') {
			statusDisp.innerHTML = 'Banker is bust';
			document.getElementById('hand_' + banker.id).style.opacity = '0.3';
			if (player.hand.name === 'Pontoon' || player.hand.name === '5 card trick') { pontoonFiveCard(); }
			else { win(); }
		}
		else if (banker.hand.name === '21') {
			statusDisp.innerHTML = 'Banker has 21';
			if (player.hand.name === 'Pontoon' || player.hand.name === '5 card trick') { pontoonFiveCard(); }
			else { banker.chips += stake; }
		} 
		else if (banker.hand.name === '5 card trick') {
			statusDisp.innerHTML = 'Banker has a 5 card trick';
			if (player.hand.name === 'Pontoon') { pontoonFiveCard(); }
			else { banker.chips += stake; }
		}
		else if (banker.hand.value < 21) {
			statusDisp.innerHTML = 'Paying ' + (banker.hand.value + 1);
			if (player.hand.name === 'Pontoon' || player.hand.name === '5 card trick') { pontoonFiveCard(); }
			else if (player.hand.value > banker.hand.value) { win(); }
			else { banker.chips += stake; }
		}

		function pontoonFiveCard() {
			if (!pontoons && player.hand.name === 'Pontoon') { pontoons = order[i]; }
			banker.chips -= stake * 2;
			player.chips += stake * 3;
			playerDiv.style.background = '#EFFFF0';
		}

		function win() {
			banker.chips -= stake;
			player.chips += stake * 2;
			playerDiv.style.background = '#EFFFF0';
		}

		player.bets = [];
		displayBet(order[i]);
	}
	displayBet(banker.id);
	console.log(statusDisp.innerHTML);
	return pontoons;
}