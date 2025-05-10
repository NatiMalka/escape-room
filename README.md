# Haunted Tech Lab - Team vs Team Escape Room

A horror-themed escape room web application where teams compete against each other to solve tech puzzles using a realistic terminal interface to escape the haunted laboratory.

## Features

- Team vs Team gameplay (1-7 players per team)
- Horror theme with tech puzzles
- Interactive terminal interface with command responses
- Real-time competition
- Score tracking and results page

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd escap-room
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How to Play

1. **Home Page**: Start by clicking "START GAME" on the home page.

2. **Team Setup**: Enter names for both teams and the number of players (1-7) for each team.

3. **Lobby**: Review game instructions and prepare your teams.

4. **Gameplay**: Teams take turns solving puzzles by typing commands into the terminal. The goal is to solve all puzzles and escape the lab!
   - Type commands and press Enter to submit
   - Read feedback from the terminal carefully
   - Use the hint button if you're stuck
   - Common commands: help, ls, cat, chmod, etc.

5. **Results**: See which team escaped first and view game statistics.

## Terminal Commands

The game features a realistic terminal interface where players can:

- Use standard Linux/Unix commands (`ls`, `cd`, `cat`, etc.)
- Decode binary messages
- Execute scripts with parameters
- Solve mathematical puzzles

The terminal will respond differently based on your input, with specific commands providing valuable clues.

## Customization

### Adding New Puzzles

To add new puzzles, edit the `puzzles` array in `src/app/game/page.tsx`. Each puzzle should follow this format:

```typescript
{
  id: number,
  title: string,
  description: string,
  initialOutput: string[],  // Lines displayed in terminal at start
  expectedInput: string,    // The correct answer
  acceptableInputs: string[], // All acceptable variations of the answer
  hint: string,
  incorrectResponses: string[], // Error messages for wrong answers
  specificResponses?: {    // Optional specific responses to commands
    [command: string]: string
  }
}
```

### Changing Theme

The horror theme can be customized by editing the CSS classes in the components and updating the theme-related text content.

## Image Credits

For the complete experience, add a horror-themed lab image named `haunted-lab.jpg` to the `public` directory.

## License

This project is open source and available under the [MIT License](LICENSE).

## Future Enhancements

- More puzzle types and terminal commands
- Sound effects for terminal feedback
- Multiplayer support via websockets
- Additional themes
- Enhanced animations and effects
- Timer penalties for incorrect answers
