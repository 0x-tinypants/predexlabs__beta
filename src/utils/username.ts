const adjectives = [
  "Sharp",
  "Iron",
  "Cold",
  "Pure",
  "Deep",
  "Prime",
  "Clean",
  "Clutch",
  "Steady",
  "True",
];

const golfWords = [
  "Fade",
  "Draw",
  "Putt",
  "Drive",
  "Chip",
  "Wedge",
  "Birdie",
  "Eagle",
  "Ace",
  "Stroke",
];

export const generateUsername = () => {
  const adj =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const golf =
    golfWords[Math.floor(Math.random() * golfWords.length)];
  const number = Math.floor(100 + Math.random() * 900);

  return `${adj}${golf}${number}`;
};