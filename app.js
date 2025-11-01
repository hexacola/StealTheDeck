// Main Application Logic for StealTheDeck
import { auth, db, realtimeDb, signInAnonymously, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, collection, doc, getDoc, setDoc, updateDoc, onSnapshot, query, where, getDocs, serverTimestamp, increment, ref, set, onValue, off, onDisconnect, runTransaction } from './firebase-config.js';

// Game state
let currentUser = null;
let isGuest = false;
let userCollection = [];
let userDeck = [];
let currentMatch = null;
let matchListener = null;
let isPlayer1 = false;
let onlineListener = null;
let userPresenceRef = null;

// Card data - basic cards pool
const basicCards = [
    { id: 'basic_1', name: 'Warrior', hp: 5, ability: 'Attack', rarity: 'common', description: 'Deals 3 damage to opponent card' },
    { id: 'basic_2', name: 'Guard', hp: 6, ability: 'Control', rarity: 'common', description: 'Reduces incoming damage by 1' },
    { id: 'basic_3', name: 'Healer', hp: 3, ability: 'Support', rarity: 'common', description: 'Heals friendly card for 2 HP' },
    { id: 'basic_4', name: 'Mage', hp: 2, ability: 'Attack', rarity: 'common', description: 'Deals 2 damage to opponent card' },
    { id: 'basic_5', name: 'Knight', hp: 7, ability: 'Attack', rarity: 'rare', description: 'Deals 4 damage to opponent card' },
    { id: 'basic_6', name: 'Shaman', hp: 4, ability: 'Support', rarity: 'rare', description: 'Heals friendly card for 3 HP' },
    { id: 'basic_7', name: 'Assassin', hp: 3, ability: 'Attack', rarity: 'rare', description: 'Deals 5 damage to opponent card' },
    { id: 'basic_8', name: 'Frost Mage', hp: 2, ability: 'Control', rarity: 'rare', description: 'Reduces opponent card HP by 2' },
    { id: 'basic_9', name: 'Paladin', hp: 8, ability: 'Support', rarity: 'epic', description: 'Heals friendly card for 4 HP' },
    { id: 'basic_10', name: 'Dragon', hp: 10, ability: 'Ultimate', rarity: 'epic', description: 'Deals 3 damage to all opponent cards' },
    { id: 'basic_11', name: 'Necromancer', hp: 4, ability: 'Control', rarity: 'epic', description: 'Reduces opponent card HP by 3' },
    { id: 'basic_12', name: 'Barbarian', hp: 9, ability: 'Attack', rarity: 'epic', description: 'Deals 6 damage to opponent card' },
    { id: 'basic_13', name: 'Archmage', hp: 5, ability: 'Ultimate', rarity: 'legendary', description: 'Deals 2 damage to all opponent cards' },
    { id: 'basic_14', name: 'Demon Lord', hp: 12, ability: 'Ultimate', rarity: 'legendary', description: 'Deals 4 damage to all opponent cards' },
    { id: 'basic_15', name: 'Angel', hp: 8, ability: 'Support', rarity: 'legendary', description: 'Heals all friendly cards for 3 HP' },
    { id: 'basic_16', name: 'Phoenix', hp: 7, ability: 'Ultimate', rarity: 'legendary', description: 'Deals 3 damage to all opponent cards' }
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAuthState();
});

// Setup event listeners
function setupEventListeners() {
    // Login buttons
    document.getElementById('guestLoginBtn').addEventListener('click', handleGuestLogin);
    document.getElementById('emailLoginBtn').addEventListener('click', showEmailForm);
    document.getElementById('googleLoginBtn').addEventListener('click', handleGoogleLogin);
    document.getElementById('signInBtn').addEventListener('click', handleEmailSignIn);
    document.getElementById('signUpBtn').addEventListener('click', handleEmailSignUp);
    document.getElementById('cancelEmailBtn').addEventListener('click', hideEmailForm);

    // Menu buttons
    document.getElementById('casualBtn').addEventListener('click', () => startQuickMatch('casual'));
    document.getElementById('rankedBtn').addEventListener('click', showRankedWarning);
    document.getElementById('deckBtn').addEventListener('click', showDeckBuilder);
    document.getElementById('shopBtn').addEventListener('click', showShop);
    document.getElementById('settingsBtn').addEventListener('click', showSettings);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Deck builder
    document.getElementById('saveDeckBtn').addEventListener('click', saveDeck);
    document.getElementById('backToMenuBtn').addEventListener('click', showMainMenu);

    // Shop
    document.getElementById('backFromShopBtn').addEventListener('click', showMainMenu);

    // Settings
    document.getElementById('backFromSettingsBtn').addEventListener('click', showMainMenu);
    document.getElementById('uiScale').addEventListener('input', (e) => {
        document.getElementById('scaleValue').textContent = e.target.value + '%';
        document.body.style.fontSize = e.target.value + '%';
    });

    // Match controls
    document.getElementById('firstDrawBtn').addEventListener('click', handleFirstDraw);
    document.getElementById('endTurnBtn').addEventListener('click', handleEndTurn);

    // Modals
    document.getElementById('continueFromMatchBtn').addEventListener('click', () => {
        document.getElementById('endMatchModal').classList.remove('show');
        showMainMenu();
    });
    document.getElementById('confirmRankedBtn').addEventListener('click', () => {
        document.getElementById('rankedWarningModal').classList.remove('show');
        startQuickMatch('ranked');
    });
    document.getElementById('cancelRankedBtn').addEventListener('click', () => {
        document.getElementById('rankedWarningModal').classList.remove('show');
    });
}

// Check authentication state
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            isGuest = user.isAnonymous;
            loadUserData();
            showMainMenu();
            await setupOnlineListener();
        } else {
            // Remove online presence when user logs out
            await removeOnlinePresence();
            currentUser = null;
            isGuest = false;
            showLogin();
        }
    });
}

// Guest login
async function handleGuestLogin() {
    try {
        const userCredential = await signInAnonymously(auth);
        showError('Successfully logged in as guest!');
    } catch (error) {
        showError(error.message);
    }
}

// Show email login form
function showEmailForm() {
    document.getElementById('emailLoginForm').style.display = 'flex';
}

function hideEmailForm() {
    document.getElementById('emailLoginForm').style.display = 'none';
}

// Email sign in
async function handleEmailSignIn() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        hideEmailForm();
    } catch (error) {
        showError(error.message);
    }
}

// Email sign up
async function handleEmailSignUp() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await initializeNewUser(userCredential.user);
        hideEmailForm();
    } catch (error) {
        showError(error.message);
    }
}

// Google login
async function handleGoogleLogin() {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        if (userCredential.additionalUserInfo.isNewUser) {
            await initializeNewUser(userCredential.user);
        }
    } catch (error) {
        showError(error.message);
    }
}

// Initialize new user data
async function initializeNewUser(user) {
    const userData = {
        username: user.displayName || user.email.split('@')[0],
        level: 1,
        xp: 0,
        rankPoints: 0,
        collection: basicCards.map(c => ({ cardId: c.id, count: 1 })),
        deck: basicCards.map(c => c.id),
        gold: 100
    };
    
    await setDoc(doc(db, 'users', user.uid), userData);
}

// Load user data
async function loadUserData() {
    if (isGuest) {
        // Guest mode - use default deck
        userCollection = basicCards;
        userDeck = basicCards.map(c => c.id);
        updateProfileDisplay();
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const data = userDoc.data();
            userCollection = data.collection || [];
            userDeck = data.deck || [];
            
            // Restore collection cards data
            userCollection = userCollection.map(item => {
                const card = basicCards.find(c => c.id === item.cardId);
                return card ? { ...card, count: item.count || 1 } : null;
            }).filter(Boolean);
            
            updateProfileDisplay();
        } else {
            await initializeNewUser(currentUser);
            await loadUserData();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Update profile display
function updateProfileDisplay() {
    document.getElementById('usernameDisplay').textContent = 
        isGuest ? 'Demo Player' : (currentUser.displayName || currentUser.email.split('@')[0]);
    document.getElementById('levelDisplay').textContent = 'Level 1'; // TODO: implement level
    document.getElementById('rankDisplay').textContent = 'Rank 1'; // TODO: implement rank
    document.getElementById('currencyDisplay').textContent = '0'; // TODO: implement currency
}

// Setup online players listener
async function setupOnlineListener() {
    try {
        // Set user as online in presence system
        const userId = currentUser.uid;
        userPresenceRef = ref(realtimeDb, `presence/${userId}`);
        
        // Set user online
        await set(userPresenceRef, {
            online: true,
            lastSeen: Date.now()
        });
        
        // Set up disconnect handler to remove user when they disconnect
        onDisconnect(userPresenceRef).remove();
        
        // Listen to presence node to count online users
        const presenceRef = ref(realtimeDb, 'presence');
        onlineListener = onValue(presenceRef, (snapshot) => {
            const presence = snapshot.val();
            if (presence) {
                // Count number of online users
                const onlineUsers = Object.keys(presence).length;
                document.getElementById('onlineCount').textContent = onlineUsers;
            } else {
                document.getElementById('onlineCount').textContent = '0';
            }
        }, (error) => {
            console.error('Online listener error:', error);
            document.getElementById('onlineCount').textContent = '?';
        });
        
    } catch (error) {
        console.error('Error setting up online listener:', error);
        document.getElementById('onlineCount').textContent = '0';
    }
}

// Remove user from online count
async function removeOnlinePresence() {
    try {
        // Remove listeners first
        if (onlineListener) {
            off(ref(realtimeDb, 'presence'), 'value', onlineListener);
            onlineListener = null;
        }
        
        // Remove presence (this will automatically update the count via listener)
        if (userPresenceRef) {
            await set(userPresenceRef, null);
        }
        
        userPresenceRef = null;
    } catch (error) {
        console.error('Error removing online presence:', error);
    }
}

// Show screens
function showLogin() {
    switchScreen('loginScreen');
}

function showMainMenu() {
    switchScreen('mainMenuScreen');
    updateMenuButtons();
}

function showDeckBuilder() {
    switchScreen('deckBuilderScreen');
    renderDeckBuilder();
}

function showShop() {
    if (isGuest) {
        showError('Shop is only available for registered users');
        return;
    }
    switchScreen('shopScreen');
}

function showSettings() {
    switchScreen('settingsScreen');
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Update menu buttons based on guest status
function updateMenuButtons() {
    const rankedBtn = document.getElementById('rankedBtn');
    const shopBtn = document.getElementById('shopBtn');
    
    if (isGuest) {
        rankedBtn.disabled = true;
        shopBtn.disabled = true;
    } else {
        rankedBtn.disabled = false;
        shopBtn.disabled = false;
    }
}

// Show ranked warning
function showRankedWarning() {
    if (isGuest) {
        showError('Ranked matches are only available for registered users');
        return;
    }
    document.getElementById('rankedWarningModal').classList.add('show');
}

// Start quick match
async function startQuickMatch(matchType) {
    try {
        // Try to find existing waiting match
        const matchesRef = collection(db, 'matches');
        const waitingMatchesQuery = query(
            matchesRef,
            where('status', '==', 'waiting'),
            where('matchType', '==', matchType)
        );
        
        const waitingMatches = await getDocs(waitingMatchesQuery);
        let matchId = null;
        let isPlayer1Local = false;
        
        if (!waitingMatches.empty && !isGuest) {
            // Join existing match
            const existingMatch = waitingMatches.docs[0];
            matchId = existingMatch.id;
            isPlayer1Local = false;
            
            await updateDoc(doc(db, 'matches', matchId), {
                player2Id: currentUser.uid,
                status: 'active',
                'matchState.player2Deck': userDeck.map(cardId => ({
                    cardId: cardId,
                    currentHP: null,
                    played: false
                })),
                'matchState.player2HP': userDeck.length * 5
            });
        } else {
            // Create new match
            matchId = doc(collection(db, 'matches')).id;
            isPlayer1Local = true;
            
            const matchData = {
                player1Id: currentUser.uid,
                player2Id: null,
                matchType: matchType,
                matchState: {
                    player1Deck: userDeck.map(cardId => {
                        const card = basicCards.find(c => c.id === cardId);
                        return {
                            cardId: cardId,
                            hp: card?.hp || 5,
                            currentHP: null,
                            played: false
                        };
                    }),
                    player2Deck: [],
                    turn: null,
                    firstDraw: { player1CardId: null, player2CardId: null },
                    chainEffects: [],
                    player1HP: userDeck.length * 5,
                    player2HP: 0
                },
                createdAt: serverTimestamp(),
                status: 'waiting'
            };
            
            await setDoc(doc(db, 'matches', matchId), matchData);
        }
        
        currentMatch = matchId;
        isPlayer1 = isPlayer1Local;
        
        // Listen for match updates
        matchListener = onSnapshot(doc(db, 'matches', matchId), (snapshot) => {
            if (snapshot.exists()) {
                const match = snapshot.data();
                updateMatchDisplay(match);
                
                // Show first draw button when both players ready and haven't drawn
                if (match.status === 'active') {
                    const firstDraw = match.matchState.firstDraw;
                    const canDraw = isPlayer1 ? !firstDraw.player1CardId : !firstDraw.player2CardId;
                    document.getElementById('firstDrawBtn').style.display = canDraw ? 'block' : 'none';
                }
            }
        });
        
        switchScreen('matchScreen');
    } catch (error) {
        console.error('Error starting match:', error);
        showError('Failed to start match');
    }
}

// Handle first draw
async function handleFirstDraw() {
    const matchRef = doc(db, 'matches', currentMatch);
    const matchDoc = await getDoc(matchRef);
    if (!matchDoc.exists()) return;
    
    const match = matchDoc.data();
    const matchState = match.matchState;
    
    // Determine which player is drawing
    const isPlayer1Drawing = isPlayer1;
    const deck = isPlayer1Drawing ? matchState.player1Deck : matchState.player2Deck;
    
    // Random card from deck
    const randomIndex = Math.floor(Math.random() * deck.length);
    const drawnCard = deck[randomIndex];
    
    // Mark card as played in deck
    const updatedDeck = [...deck];
    updatedDeck[randomIndex] = { ...updatedDeck[randomIndex], played: true, currentHP: drawnCard.hp };
    
    // Update match state
    const updateData = {};
    if (isPlayer1Drawing) {
        updateData['matchState.firstDraw.player1CardId'] = drawnCard.cardId;
        updateData['matchState.player1Deck'] = updatedDeck;
    } else {
        updateData['matchState.firstDraw.player2CardId'] = drawnCard.cardId;
        updateData['matchState.player2Deck'] = updatedDeck;
    }
    
    await updateDoc(matchRef, updateData);
    
    // Hide first draw button after both players draw
    if (match.matchState.firstDraw.player1CardId && match.matchState.firstDraw.player2CardId) {
        document.getElementById('firstDrawBtn').style.display = 'none';
        document.getElementById('endTurnBtn').style.display = 'block';
    }
    
    // Apply abilities from first draw cards if both drawn
    if (match.matchState.firstDraw.player1CardId && match.matchState.firstDraw.player2CardId) {
        const player1Card = basicCards.find(c => c.id === match.matchState.firstDraw.player1CardId);
        const player2Card = basicCards.find(c => c.id === match.matchState.firstDraw.player2CardId);
        
        // Apply abilities simultaneously
        if (player1Card) await applyCardAbility(player1Card, [], true);
        if (player2Card) await applyCardAbility(player2Card, [], false);
        
        // Set initial turn randomly
        if (!match.matchState.turn) {
            const startingPlayer = Math.random() < 0.5 ? 'player1' : 'player2';
            await updateDoc(matchRef, { 'matchState.turn': startingPlayer });
        }
    }
}

// Handle end turn
async function handleEndTurn() {
    if (!currentMatch) return;
    
    const matchRef = doc(db, 'matches', currentMatch);
    const matchDoc = await getDoc(matchRef);
    if (!matchDoc.exists()) return;
    
    const match = matchDoc.data();
    const matchState = match.matchState;
    
    // Switch turn
    const newTurn = matchState.turn === 'player1' ? 'player2' : 'player1';
    
    await updateDoc(matchRef, {
        'matchState.turn': newTurn
    });
    
    showError('Turn ended. Waiting for opponent...');
}

// Card ability system
function getAbilityDamage(cardName, ability) {
    const abilities = {
        'Attack': {
            'Warrior': 3,
            'Mage': 2,
            'Knight': 4,
            'Assassin': 5,
            'Barbarian': 6
        },
        'Control': {
            'Guard': 1, // Damage reduction
            'Frost Mage': 2,
            'Necromancer': 3
        },
        'Support': {
            'Healer': 2, // Heal amount
            'Shaman': 3,
            'Paladin': 4,
            'Angel': 3 // To all
        },
        'Ultimate': {
            'Dragon': 3, // To all
            'Archmage': 2, // To all
            'Demon Lord': 4, // To all
            'Phoenix': 3 // To all
        }
    };
    
    return abilities[ability]?.[cardName] || 0;
}

// Apply card ability
async function applyCardAbility(card, targetCards, isPlayer1Action) {
    if (!currentMatch) return null;
    
    const matchRef = doc(db, 'matches', currentMatch);
    const matchDoc = await getDoc(matchRef);
    if (!matchDoc.exists()) return null;
    
    const match = matchDoc.data();
    const matchState = match.matchState;
    
    const damage = getAbilityDamage(card.name, card.ability);
    
    // Support and healing abilities target friendly cards
    if (card.ability === 'Support') {
        const friendlyDeck = isPlayer1Action ? matchState.player1Deck : matchState.player2Deck;
        let updatedDeck = [...friendlyDeck];
        
        if (card.name === 'Angel') {
            // AOE heal
            updatedDeck = updatedDeck.map(cardState => {
                if (cardState.played && cardState.currentHP > 0) {
                    const newHP = Math.min(cardState.currentHP + damage, cardState.hp);
                    return { ...cardState, currentHP: newHP };
                }
                return cardState;
            });
        } else {
            // Single target heal
            const validTargets = updatedDeck.filter(c => c.played && c.currentHP > 0);
            if (validTargets.length > 0) {
                const randomTargetIndex = Math.floor(Math.random() * validTargets.length);
                const randomTarget = validTargets[randomTargetIndex];
                // Find the actual index in the full deck
                const targetIndex = updatedDeck.findIndex(c => c.cardId === randomTarget.cardId && c.played);
                if (targetIndex !== -1) {
                    const newHP = Math.min(randomTarget.currentHP + damage, randomTarget.hp);
                    updatedDeck[targetIndex] = { ...updatedDeck[targetIndex], currentHP: newHP };
                }
            }
        }
        
        const updatePath = isPlayer1Action ? 'matchState.player1Deck' : 'matchState.player2Deck';
        await updateDoc(matchRef, {
            [updatePath]: updatedDeck
        });
        return damage;
    }
    
    // Attack and Control abilities target enemy cards
    const targets = isPlayer1Action ? matchState.player2Deck : matchState.player1Deck;
    let updatedDeck = [...targets];
    
    if (card.ability === 'Ultimate') {
        // AOE damage
        updatedDeck = updatedDeck.map(cardState => {
            if (cardState.played && cardState.currentHP > 0) {
                const newHP = Math.max(cardState.currentHP - damage, 0);
                return { ...cardState, currentHP: newHP };
            }
            return cardState;
        });
    } else {
        // Single target damage
        const validTargets = updatedDeck.filter(c => c.played && c.currentHP > 0);
        if (validTargets.length > 0) {
            const randomTargetIndex = Math.floor(Math.random() * validTargets.length);
            const randomTarget = validTargets[randomTargetIndex];
            // Find the actual index in the full deck
            const targetIndex = updatedDeck.findIndex(c => c.cardId === randomTarget.cardId && c.played);
            if (targetIndex !== -1) {
                const newHP = Math.max(randomTarget.currentHP - damage, 0);
                updatedDeck[targetIndex] = { ...updatedDeck[targetIndex], currentHP: newHP };
            }
        }
    }
    
    const updatePath = isPlayer1Action ? 'matchState.player2Deck' : 'matchState.player1Deck';
    await updateDoc(matchRef, {
        [updatePath]: updatedDeck
    });
    
    // Add visual feedback
    showDamageAnimation(damage, card, isPlayer1Action);
    
    return damage;
}

// Show damage animation
function showDamageAnimation(damage, card, isPlayer1Action = isPlayer1) {
    const board = isPlayer1Action ? document.getElementById('opponentBoard') : document.getElementById('playerBoard');
    const damageElement = document.createElement('div');
    damageElement.className = 'damage-number';
    damageElement.textContent = card.ability === 'Support' ? `+${damage}` : `-${damage}`;
    damageElement.style.left = '50%';
    damageElement.style.top = '50%';
    damageElement.style.position = 'absolute';
    damageElement.style.pointerEvents = 'none';
    damageElement.style.zIndex = '1000';
    board.style.position = 'relative';
    board.appendChild(damageElement);
    
    setTimeout(() => {
        damageElement.remove();
    }, 1000);
}

// Play card from hand
async function playCard(card) {
    if (!currentMatch) return;
    
    const matchRef = doc(db, 'matches', currentMatch);
    const matchDoc = await getDoc(matchRef);
    if (!matchDoc.exists()) return;
    
    const match = matchDoc.data();
    const matchState = match.matchState;
    
    if ((isPlayer1 && matchState.turn !== 'player1') || (!isPlayer1 && matchState.turn !== 'player2')) {
        showError('Not your turn!');
        return;
    }
    
    // Add to board
    const boardDeck = isPlayer1 ? matchState.player1Deck : matchState.player2Deck;
    const boardIndex = boardDeck.findIndex(c => c.cardId === card.id && !c.played);
    
    if (boardIndex !== -1) {
        const updatedDeck = [...boardDeck];
        updatedDeck[boardIndex] = { ...updatedDeck[boardIndex], played: true, currentHP: card.hp };
        
        const updatePath = isPlayer1 ? 'matchState.player1Deck' : 'matchState.player2Deck';
        await updateDoc(matchRef, {
            [updatePath]: updatedDeck
        });
        
        // Apply ability immediately
        await applyCardAbility(card, [], isPlayer1);
        
        // Render cards
        renderMatchBoard();
    }
}

// Update match display
function updateMatchDisplay(match) {
    const matchState = match.matchState;
    
    document.getElementById('playerName').textContent = currentUser.displayName || 'You';
    document.getElementById('playerHP').textContent = matchState.player1HP || 0;
    
    if (match.player2Id) {
        document.getElementById('opponentHP').textContent = matchState.player2HP || 0;
    }
    
    // Update turn indicator
    const turnIndicator = document.getElementById('turnIndicator');
    if (matchState.turn === 'player1') {
        turnIndicator.textContent = isPlayer1 ? 'Your Turn' : 'Opponent\'s Turn';
    } else if (matchState.turn === 'player2') {
        turnIndicator.textContent = isPlayer1 ? 'Opponent\'s Turn' : 'Your Turn';
    }
    
    // Render boards
    renderMatchBoard();
    
    // Check win condition
    checkWinCondition(match);
}

// Render match board
function renderMatchBoard() {
    if (!currentMatch) return;
    
    // Get match data
    getDoc(doc(db, 'matches', currentMatch)).then(matchDoc => {
        if (!matchDoc.exists()) return;
        
        const match = matchDoc.data();
        const matchState = match.matchState;
        
        // Render player board
        const playerBoard = document.getElementById('playerBoard');
        playerBoard.innerHTML = '';
        const playerDeck = isPlayer1 ? matchState.player1Deck : matchState.player2Deck;
        
        playerDeck.forEach((cardState, index) => {
            const card = basicCards.find(c => c.id === cardState.cardId);
            if (card && cardState.played) {
                const cardElement = createBoardCard(card, cardState, true);
                playerBoard.appendChild(cardElement);
            }
        });
        
        // Render opponent board
        const opponentBoard = document.getElementById('opponentBoard');
        opponentBoard.innerHTML = '';
        const opponentDeck = isPlayer1 ? matchState.player2Deck : matchState.player1Deck;
        
        opponentDeck.forEach((cardState, index) => {
            const card = basicCards.find(c => c.id === cardState.cardId);
            if (card && cardState.played) {
                const cardElement = createBoardCard(card, cardState, false);
                opponentBoard.appendChild(cardElement);
            }
        });
        
        // Render hand
        renderHand();
    });
}

// Create board card element
function createBoardCard(card, cardState, isPlayer) {
    const cardElement = document.createElement('div');
    cardElement.className = `board-card card ${card.rarity}`;
    
    const currentHP = cardState.currentHP || cardState.hp;
    const hpPercent = (currentHP / card.hp) * 100;
    const cardEmoji = getCardEmoji(card.name);
    const abilityValue = getAbilityDamage(card.name, card.ability);
    const abilityIcon = card.ability === 'Attack' ? '⚔️' : 
                       card.ability === 'Support' ? '❤️' :
                       card.ability === 'Ultimate' ? '💥' : '🛡️';
    
    cardElement.innerHTML = `
        <div class="hp-bar"><div class="hp-bar-fill" style="width: ${hpPercent}%"></div></div>
        <div class="card-image">${cardEmoji}</div>
        <div class="card-name-display">${card.name}</div>
        <div class="card-stats">
            <div class="card-hp">${currentHP}/${card.hp}</div>
            <div class="card-ability-value">${abilityIcon}${abilityValue}</div>
        </div>
    `;
    
    if (isPlayer && cardState.currentHP <= 0) {
        cardElement.classList.add('shake');
        setTimeout(() => cardElement.remove(), 500);
    }
    
    return cardElement;
}

// Render hand
function renderHand() {
    if (!currentMatch) return;
    
    // Rebuild hand from match state
    getDoc(doc(db, 'matches', currentMatch)).then(matchDoc => {
        if (!matchDoc.exists()) return;
        
        const match = matchDoc.data();
        const matchState = match.matchState;
        const deck = isPlayer1 ? matchState.player1Deck : matchState.player2Deck;
        
        // Get all unplayed cards
        const unplayedCards = deck.filter(c => !c.played).map(cardState => {
            return basicCards.find(c => c.id === cardState.cardId);
        }).filter(Boolean);
        
        const handDisplay = document.getElementById('handDisplay');
        handDisplay.innerHTML = '';
        
        unplayedCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.rarity}`;
            cardElement.innerHTML = renderCard(card, true);
            cardElement.addEventListener('click', () => playCard(card));
            handDisplay.appendChild(cardElement);
        });
    });
}

// Check win condition
async function checkWinCondition(match) {
    const matchState = match.matchState;
    
    // Count alive cards for each player
    const player1Alive = matchState.player1Deck.filter(c => c.played && c.currentHP > 0).length;
    const player2Alive = matchState.player2Deck.filter(c => c.played && c.currentHP > 0).length;
    
    let winner = null;
    if (player1Alive === 0 && player2Alive > 0) {
        winner = 'player2';
    } else if (player2Alive === 0 && player1Alive > 0) {
        winner = 'player1';
    }
    
    if (winner) {
        await endMatch(winner, match);
    }
}

// End match
async function endMatch(winner, match) {
    const isWinner = (winner === 'player1' && isPlayer1) || (winner === 'player2' && !isPlayer1);
    
    if (matchListener) {
        matchListener();
        matchListener = null;
    }
    
    const modalTitle = document.getElementById('endMatchTitle');
    const modalContent = document.getElementById('endMatchContent');
    
    modalTitle.textContent = isWinner ? 'Victory!' : 'Defeat!';
    modalTitle.style.color = isWinner ? 'var(--hp-green)' : 'var(--hp-red)';
    
    modalContent.innerHTML = '';
    
    // Update user data if winner
    if (isWinner && !isGuest && match.matchType === 'ranked') {
        // Transfer card logic here
        modalContent.innerHTML += '<p>You won a random card from opponent!</p>';
        
        try {
            // Get opponent's collection
            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
            const opponentDoc = await getDoc(doc(db, 'users', opponentId));
            
            if (opponentDoc.exists()) {
                const opponentData = opponentDoc.data();
                const transferableCards = opponentData.collection.filter(c => !basicCards.some(b => b.id === c.cardId));
                
                if (transferableCards.length > 0) {
                    const randomCard = transferableCards[Math.floor(Math.random() * transferableCards.length)];
                    
                    // Add to winner's collection
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    const userData = userDoc.data();
                    const userCollection = userData.collection || [];
                    
                    const existingCard = userCollection.find(c => c.cardId === randomCard.cardId);
                    if (existingCard) {
                        existingCard.count++;
                    } else {
                        userCollection.push({ cardId: randomCard.cardId, count: 1 });
                    }
                    
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        collection: userCollection,
                        gold: increment(50),
                        rankPoints: increment(10)
                    });
                    
                    modalContent.innerHTML += `<p>You received: <strong>${basicCards.find(c => c.id === randomCard.cardId)?.name || 'Unknown'}</strong></p>`;
                    
                    // Remove from loser's collection
                    const newOpponentCollection = opponentData.collection.map(c => {
                        if (c.cardId === randomCard.cardId) {
                            return { ...c, count: c.count - 1 };
                        }
                        return c;
                    }).filter(c => c.count > 0);
                    
                    await updateDoc(doc(db, 'users', opponentId), {
                        collection: newOpponentCollection
                    });
                }
            }
        } catch (error) {
            console.error('Error transferring card:', error);
        }
    }
    
    modalContent.innerHTML += '<p>Thanks for playing!</p>';
    
    document.getElementById('endMatchModal').classList.add('show');
}

// Render deck builder
function renderDeckBuilder() {
    // Create deck slots
    const deckSlots = document.getElementById('deckSlots');
    deckSlots.innerHTML = '';
    
    for (let i = 0; i < 16; i++) {
        const slot = document.createElement('div');
        slot.className = 'deck-slot';
        slot.dataset.index = i;
        slot.innerHTML = userDeck[i] ? renderCard(basicCards.find(c => c.id === userDeck[i]), false) : '';
        if (userDeck[i]) slot.classList.add('filled');
        slot.addEventListener('click', () => removeFromDeck(i));
        deckSlots.appendChild(slot);
    }
    
    // Update deck count
    document.getElementById('deckCount').textContent = userDeck.filter(Boolean).length;
    
    // Render collection
    renderCollection();
}

// Render collection
function renderCollection() {
    const collectionGrid = document.getElementById('collectionGrid');
    collectionGrid.innerHTML = '';
    
    userCollection.forEach(card => {
        if (card) {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.rarity}`;
            cardElement.innerHTML = renderCard(card, true);
            cardElement.addEventListener('click', () => addToDeck(card.id));
            collectionGrid.appendChild(cardElement);
        }
    });
}

// Get card emoji based on name
function getCardEmoji(cardName) {
    const emojiMap = {
        'Warrior': '⚔️', 'Guard': '🛡️', 'Healer': '❤️', 'Mage': '✨',
        'Knight': '👑', 'Shaman': '🔮', 'Assassin': '🗡️', 'Frost Mage': '❄️',
        'Paladin': '⚜️', 'Dragon': '🐉', 'Necromancer': '💀', 'Barbarian': '🔥',
        'Archmage': '🔯', 'Demon Lord': '👹', 'Angel': '😇', 'Phoenix': '🔥'
    };
    return emojiMap[cardName] || '🎴';
}

// Render card
function renderCard(card, showTooltip) {
    if (!card) return '';
    
    const tooltip = showTooltip ? `
        <div class="card-tooltip">
            <div class="card-name">${card.name}</div>
            <div class="card-ability">${card.ability}</div>
            <div class="card-rarity">${card.rarity}</div>
        </div>
    ` : '';
    
    // Get damage/heal value for display
    const abilityValue = getAbilityDamage(card.name, card.ability);
    const abilityIcon = card.ability === 'Attack' ? '⚔️' : 
                       card.ability === 'Support' ? '❤️' :
                       card.ability === 'Ultimate' ? '💥' : '🛡️';
    const cardEmoji = getCardEmoji(card.name);
    
    return `
        ${tooltip}
        <div class="card-image">${cardEmoji}</div>
        <div class="card-name-display">${card.name}</div>
        <div class="card-stats">
            <div class="card-hp">${card.hp}</div>
            <div class="card-ability-value">${abilityIcon}${abilityValue}</div>
        </div>
    `;
}

// Add card to deck
function addToDeck(cardId) {
    if (userDeck.filter(Boolean).length >= 16) {
        showError('Deck is full!');
        return;
    }
    
    const emptyIndex = userDeck.findIndex(slot => !slot);
    if (emptyIndex !== -1) {
        userDeck[emptyIndex] = cardId;
        renderDeckBuilder();
    }
}

// Remove card from deck
function removeFromDeck(index) {
    userDeck[index] = null;
    renderDeckBuilder();
}

// Save deck
async function saveDeck() {
    if (isGuest) {
        showError('Guests cannot save decks');
        return;
    }
    
    if (userDeck.filter(Boolean).length !== 16) {
        showError('Deck must have exactly 16 cards');
        return;
    }
    
    try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
            deck: userDeck.filter(Boolean)
        });
        showError('Deck saved successfully!');
    } catch (error) {
        showError('Failed to save deck');
    }
}

// Open loot case
async function openLootCase(rarity, cost) {
    if (isGuest) {
        showError('Guests cannot open loot cases');
        return;
    }
    
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists()) return;
        
        const userData = userDoc.data();
        const currentGold = userData.gold || 0;
        
        if (currentGold < cost) {
            showError('Not enough gold!');
            return;
        }
        
        // Calculate cards based on rarity tier
        const numCards = rarity === 'epic' ? 5 : 3;
        const newCards = [];
        
        for (let i = 0; i < numCards; i++) {
            const random = Math.random();
            let cardRarity = 'common';
            
            if (rarity === 'common') {
                if (random < 0.80) cardRarity = 'common';
                else if (random < 0.95) cardRarity = 'rare';
                else if (random < 1.0) cardRarity = 'epic';
            } else if (rarity === 'rare') {
                if (random < 0.50) cardRarity = 'common';
                else if (random < 0.85) cardRarity = 'rare';
                else if (random < 0.97) cardRarity = 'epic';
                else cardRarity = 'legendary';
            } else if (rarity === 'epic') {
                if (random < 0.30) cardRarity = 'common';
                else if (random < 0.70) cardRarity = 'rare';
                else if (random < 0.95) cardRarity = 'epic';
                else cardRarity = 'legendary';
            }
            
            // Get random card of that rarity
            const rarityCards = basicCards.filter(c => c.rarity === cardRarity);
            const randomCard = rarityCards[Math.floor(Math.random() * rarityCards.length)];
            newCards.push(randomCard);
        }
        
        // Update collection
        const collection = userData.collection || [];
        newCards.forEach(card => {
            const existingCard = collection.find(c => c.cardId === card.id);
            if (existingCard) {
                existingCard.count++;
            } else {
                collection.push({ cardId: card.id, count: 1 });
            }
        });
        
        // Update database
        await updateDoc(doc(db, 'users', currentUser.uid), {
            collection: collection,
            gold: currentGold - cost
        });
        
        // Reload user data
        await loadUserData();
        
        // Show success message
        const cardNames = newCards.map(c => c.name).join(', ');
        showError(`Loot opened! Got: ${cardNames}`);
        
    } catch (error) {
        console.error('Error opening loot case:', error);
        showError('Failed to open loot case');
    }
}

// Handle logout
async function handleLogout() {
    try {
        if (matchListener) {
            matchListener();
        }
        await removeOnlinePresence();
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

// Export functions for global access
window.openLootCase = openLootCase;

