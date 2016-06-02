function cutForBanker() {
	var banker = pontoon.determineDealer(),
		nameDisplay = document.getElementById( 'player_' + banker );
	
	nameDisplay.className = 'banker';
	bankerDisplay.innerHTML = pontoon.players.lookup(banker).name;
	displayCut();

	console.log('Banker: ' + pontoon.players.lookup(banker).name + ' cut the highest card');
	gameStart();
}

function twisted(id, hand) { // This could possibly be published in cards.js hand.total()
	if (hand.value >= 15) { document.getElementById('stick-'+id).removeAttribute('disabled'); }
	else { document.getElementById('stick-'+id).setAttribute('disabled', true); }

	if (id === pontoon.table.banker) {
		if (hand.cards.length === 5 || hand.state === 'Bust') { $.publish('gameFinished', id); } 
		else if (hand.value === 21 && hand.state === 'Soft') { } 
		else if (hand.name === '21') { $.publish('gameFinished', id); }
	}
	else {
		if (hand.cards.length === 5 || hand.state === 'Bust') { $.publish('turnFinished', id); } 
		else if (hand.value === 21 && hand.state === 'Soft') { } 
		else if (hand.name === '21') { $.publish('turnFinished', id); }		
		else if (pontoon.players.lookup(id).bets.length === hand.cards.length -1) {
			if (pontoon.players.lookup(id).chips >= document.getElementById('stake-' + id).min) {
				document.getElementById('buy-'+id).removeAttribute('disabled');
			}
			document.getElementById('twist-'+id).removeAttribute('disabled');
		}
	}
}

function checkHands(order) {
	var pontoons,
		banker = pontoon.players.lookup(pontoon.table.banker);

	for (var i = 0, len = order.length; i < len; i++) {
		var player = pontoon.players.lookup(order[i]),
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