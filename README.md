# TOMAX Security Escape Room

A multiplayer cyber-themed escape room challenge where teams must work together to stop a critical system breach before time runs out.

## Features

- **Real-time Multiplayer**: Work collaboratively with team members using WebSockets
- **Leader-based Control**: One team member controls inputs while others assist in solving puzzles
- **Synchronized Screens**: All team members see the same game state in real-time
- **Interactive Hacker Chat**: Engage with the mysterious hacker who's compromised the system
- **Timed Challenges**: Race against the clock to defuse the logic bomb

## Technology Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Real-time Communication**: Socket.io for WebSockets
- **Database**: Firebase Firestore for game state persistence
- **Authentication**: Firebase Authentication for secure access

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/NatiMalka/escape-room.git
   cd escape-room
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Firestore Database and Authentication
   - Add a web app to your Firebase project
   - Copy your Firebase configuration from the Firebase Console
   - Update the Firebase config in `src/firebase/config.js`

4. Create a Firebase service account key:
   - Go to Project Settings > Service Accounts
   - Generate a new private key
   - Save the JSON file as `firebase-admin-key.json` in the root directory
   - Replace the placeholder values in the existing `firebase-admin-key.json` file
   - Ensure this file is in your .gitignore and never committed to version control

   **Important Note**: Without a valid service account key, the server will not start correctly.
   The file should look like:
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "your-private-key-id",
     "private_key": "-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
     "client_id": "your-client-id",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project-id.iam.gserviceaccount.com",
     "universe_domain": "googleapis.com"
   }
   ```

### Running the Application

1. Start the development server:
   ```
   npm run dev:server
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Create a room or join an existing one with a room code

### Multiplayer Setup

1. The first player creates a room and becomes the host
2. The host shares the room code with team members
3. Team members join using the room code
4. The team selects a leader who will control inputs
5. The host starts the game when everyone is ready

## Game Flow

1. **Lobby**: Team members join and select a leader
2. **Introduction**: Watch the hacker's message
3. **Login Challenge**: Crack the system credentials
4. **Terminal Access**: Solve puzzles to regain control
5. **Logic Bomb**: Defuse the final logic bomb before time runs out

## Development

### Running in Development Mode

```
npm run dev:server
```

### Building for Production

```
npm run build
```

### Starting Production Server

```
npm run server
```

## License

[MIT](LICENSE)

## Acknowledgments

- Background music and sound effects from freemusicarchive.org
- Hacker video footage is used for educational purposes only
