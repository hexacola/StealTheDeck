# StealTheDeck - 1v1 Card Game

A browser-based 1v1 card game built with HTML, CSS, JavaScript, and Firebase, featuring real-time multiplayer, persistent collections, and pixel-art style design.

## Features

### Authentication & User System
- **Guest Mode**: Quick anonymous login for casual play
- **Registered Users**: Email/Google authentication with full features
- **User Profiles**: Level, XP, rank points, gold, and card collections

### Game Modes
- **Casual Mode**: Practice without permanent card loss
- **Ranked Mode**: Risk/Reward matches with card stealing mechanics

### Card System
- **16 Card Decks**: Build your perfect deck from your collection
- **4 Rarities**: Common, Rare, Epic, Legendary
- **4 Ability Types**: 
  - Attack: Deal damage to opponents
  - Control: Manipulate board state
  - Support: Heal and buff allies
  - Ultimate: Powerful area effects

### Match Mechanics
- **Simultaneous First Draw**: Both players draw and play cards simultaneously
- **Turn-Based Combat**: Strategic card placement and ability usage
- **Real-Time Updates**: Firebase Realtime Database for live match state
- **Card Stealing**: Ranked winners permanently steal cards from losers

### Shop & Progression
- **Loot Cases**: Three tiers (Common, Rare, Epic) with different drop rates
- **Collection Management**: Build and upgrade your card collection
- **Gold System**: Earn currency through victories

### UI Features
- **Pixel-Art Style**: Retro-inspired visual design
- **Responsive Layout**: Works on desktop and mobile
- **Settings Menu**: Sound, music, UI scale, and notifications
- **Online Counter**: See how many players are online

## Installation & Setup

1. **Clone or Download** this repository
2. **Open `index.html`** in a modern web browser
3. Firebase configuration is already set up in `firebase-config.js`

## Project Structure

```
Card game/
├── index.html              # Main HTML structure
├── styles.css              # Pixel-art styling
├── app.js                  # Core game logic
├── firebase-config.js      # Firebase integration
└── README.md              # Documentation
```

## Firebase Setup

The project uses Firebase for:
- **Authentication**: User login and registration
- **Firestore**: Persistent user data and match history
- **Realtime Database**: Live match state synchronization

**Note**: The Firebase configuration is already included. Make sure Firestore and Realtime Database are enabled in your Firebase project.

### Required Firebase Services

1. **Authentication**
   - Enable Anonymous, Email/Password, and Google providers

2. **Firestore Database**
   - Create collections: `users`, `matches`
   - Set up appropriate security rules

3. **Realtime Database**
   - Create node: `online` (counter)
   - Set up appropriate security rules

### Security Rules Example

**Firestore:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /matches/{matchId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Realtime Database:**
```
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "online": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## Game Rules

### Card Basics
- Each card has HP (hit points) and an ability
- Cards are destroyed when HP reaches 0
- First player to eliminate all opponent cards wins

### First Draw Phase
- Both players simultaneously draw one random card
- Cards are automatically played on the board
- Abilities trigger immediately

### Turn Phase
- Alternating turns after first draw
- Play cards from hand to board
- Abilities trigger on play
- End turn to pass control

### Ranked Matches
- Winner permanently steals ONE random card from loser's collection
- Only non-basic cards can be stolen
- Winner gains rank points and gold
- Warning shown before entering ranked

### Casual Matches
- No permanent card loss
- Good for testing decks and strategies
- Accessible to guest users

## Card Abilities

### Attack Cards
- **Warrior**: 3 damage
- **Mage**: 2 damage
- **Knight**: 4 damage
- **Assassin**: 5 damage
- **Barbarian**: 6 damage

### Control Cards
- **Guard**: Reduces damage by 1
- **Frost Mage**: 2 damage
- **Necromancer**: 3 damage

### Support Cards
- **Healer**: Heal 2 HP
- **Shaman**: Heal 3 HP
- **Paladin**: Heal 4 HP
- **Angel**: Heal all cards 3 HP (AOE)

### Ultimate Cards
- **Dragon**: 3 damage to all (AOE)
- **Archmage**: 2 damage to all (AOE)
- **Demon Lord**: 4 damage to all (AOE)
- **Phoenix**: 3 damage to all (AOE)

## Development Notes

### Modular Design
- Card data in `basicCards` array - easy to add new cards
- Card rendering functions support tooltips and hover effects
- Ability system uses lookup tables for easy balancing
- Pixel-art placeholders designed for easy asset replacement

### Future Enhancements
- Full pixel-art assets
- Sound effects and music
- Animations for card plays
- Tournament system
- Spectator mode
- Card upgrades/leveling
- Leaderboards

### Browser Compatibility
- Modern browsers with ES6 module support
- Chrome, Firefox, Edge, Safari (latest versions)
- Mobile browsers with touch support

## License

Free to use and modify for personal/project purposes.

## Credits

Built with:
- HTML5/CSS3/JavaScript
- Firebase (Authentication, Firestore, Realtime Database)
- Pixel-art inspired design

Enjoy playing StealTheDeck! 🎮

