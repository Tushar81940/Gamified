# You're designing a backend for an arcade that runs weekly game tournaments. Players compete in different games, earn scores, and win prizes based on performance.
# Requirements:
# 1. Player Class: Create a class with attributes: name, age, and scores dictionary (game:score).
# 2. Game Inheritance: Create a base Game class. Inherit ShootingGame, RacingGame with specific scoring rules.
# 3. Game Logic: Add a method in each subclass to simulate playing a game (returns score using arithmetic logic).
# 4. Play Simulation: Use a loop to simulate 5 players playing 2 games each. Update their score records.
# 5. Age-Based Bonus: If a player is under 16 or over 50, add a 5% bonus to each game score.
# 6. Top Scorer: Identify the player with the highest total score using loop + conditionals.
# 7. Category Winners: Separate winners per game category using loops and comparisons.
# 8. Disqualify: Disqualify any player who scores < 40 in both games.
# 9. Leaderboard: Generate a leaderboard sorted by total score.
# 10. Final Report: Display each player’s name, game-wise scores, total score, bonus applied, and status (qualified/disqualified).

import random
from typing import Dict, List
class Player:
    
    
