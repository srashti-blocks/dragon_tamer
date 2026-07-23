# Dragon Tamer 🐉

A small browser game I built with plain HTML, CSS and JavaScript (no frameworks, no libraries). You play a wandering adventurer trying to level up, buy better gear, and eventually take down a dragon that's been terrorizing the town.

I started this from a basic "click button, change text" tutorial project, but it felt way too static — like an advanced calculator instead of a game. So I rebuilt most of it myself: added real turn-based combat with animations, a shop economy, and monster difficulty tiers based on your level.

## How to play

1. Clone/download the repo
2. Just open `index.html` in your browser — no build step, no npm install, nothing

You start in the town square with 50 gold and a stick. Head into the cave to fight monsters and earn XP + gold + loot, then go to the store to buy potions and better weapons before you're strong enough to take on the dragon.

## Features

- Turn based combat — the monster telegraphs its attack first, then you choose to **Attack**, **Dodge**, or **Run**
- Animated sprites (lunge, hit flash, dodge hop, death animation) and floating damage numbers, so fights actually feel like fights instead of just numbers changing
- Monsters are locked by level — you can't just walk up and fight the dragon at level 1, you have to grind slimes and the fanged beast first
- Loot system — monsters drop items (slime gel, beast fangs, dragon scales) that you sell at the store to fund new weapons
- XP / leveling system that increases your max health as you level up
- Win/lose screens with a restart option

## Tech used

- HTML5
- CSS3 (custom animations with keyframes, no animation libraries)
- Vanilla JavaScript (DOM manipulation, async/await + setTimeout for sequencing the combat animations)

No frameworks or external JS libraries — wanted to keep it simple and show I understand the fundamentals.

## Things I'd add if I keep working on it

- Sound effects for hits/attacks
- More monster types and a proper "boss" tier above the dragon
- Save progress with localStorage
- Mobile touch improvements

## Why I built this

Made this as part of my placement prep — wanted something in my portfolio that's more than a copy-pasted tutorial, so I focused on fixing the broken parts of the original project (no working combat, duplicate IDs, typos in the logic) and then added real game feel on top.
