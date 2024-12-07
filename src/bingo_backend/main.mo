// src/bingo_backend/main.mo

import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Error "mo:base/Error";
import Nat "mo:base/Nat";
import Nat16 "mo:base/Nat16";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Char "mo:base/Char";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Blob "mo:base/Blob";
import ICPTransferBackend "canister:icp_transfer_backend";
import Ledger "ledger";

actor {

// Winner Type
type Winner = {
  principal : Principal;
  username : ?Text;
};

// Message Type
type Message = {
  username : Text;
  text : Text;
  timestamp : Time.Time;
  gameNumber : Nat;
};

// Define WinType as a shared type
type WinType = { #Blackout; #Standard };

// Game Type
type Game = {
  gameNumber : Nat;
  hostPrincipalId : Principal;
  gameName : Text;
  scheduledStartTime : Time.Time;
  startTime : ?Time.Time;
  endTime : ?Time.Time;
  resetTime : ?Time.Time;
  playerCards : [(Principal, [Nat])];
  gameInProgress : Bool;
  calledNumbers : [Nat];
  currentNumberIndex : Nat;
  winner : ?Winner;
  winType : WinType; 
  cardCount : Nat;
  messages : [Message];
  price : Nat; 
  playersPaid : [Principal]; 
  hostPercentage : Nat16; 
  completed : Bool; 
  password : ?Text; 
  lastNumberDrawTime : ?Time.Time; 
  hostAssignedTime : ?Time.Time; 
};

// Update GameSummary to include winType
type GameSummary = {
  gameNumber : Nat;
  gameName : Text;
  scheduledStartTime : Time.Time;
  hostPrincipalId : Principal;
  gameInProgress : Bool;
  winner : ?Winner;
  cardCount : Nat;
  price : Nat; 
  hostPercentage : Nat16; 
  completed : Bool; 
  passwordProtected : Bool; 
  startTime : ?Time.Time; 
  lastNumberDrawTime : ?Time.Time; 
  hostAssignedTime : ?Time.Time; 
  winType : WinType; 
};

// **Corrected**: Define CheckWinResult as a variant
type CheckWinResult = { #Won; #NotWon; #GameAlreadyWon };

stable var games : [Game] = [];
stable var gameNumberCounter : Nat = 1;

// Username Management
type UsernameEntry = {
  principal : Principal;
  username : Text;
  timestamp : Time.Time;
};
stable var usernames : [UsernameEntry] = [];

// Contact Messages
type ContactMessage = {
  id : Nat;
  email : Text;
  name : Text;
  message : Text;
  timestamp : Time.Time;
};
stable var contactMessages : [ContactMessage] = [];
stable var contactMessageCounter : Nat = 1;

// Ledger canister ID
let ledgerCanister : Ledger.Service = actor "ryjl3-tyaaa-aaaaa-aaaba-cai";

// Define the ICPTransferBackend actor interface manually
type Result = { #Ok : Nat64; #Err : Text };
type Tokens = { e8s : Nat64 };
type TransferArgs = {
  to_principal : Principal;
  to_subaccount : ?Blob;
  amount : Tokens;
};

type ICPTransferBackend = actor {
  canister_account : shared query () -> async Blob;
  transfer : shared TransferArgs -> async Result;
};

// Initialize the ICPTransferBackend actor reference
let icpTransferBackend : ICPTransferBackend = actor "w4qr5-faaaa-aaaap-anunq-cai";

// Helper function to convert Text to AccountIdentifier (Blob)
func accountIdentifierFromText(accountText : Text) : Ledger.AccountIdentifier {
  return Text.encodeUtf8(accountText);
};

// Service Fee Account Identifier
let serviceFeeAccount : Ledger.AccountIdentifier = accountIdentifierFromText("1510d66d73fb20962516511357e90bf2503cfa1ba66d26ac0dcdc07c2be0e78e");


// Function to send winnings to the winner
func sendWinnings(toAccount : Text, amountE8s : Nat) : async Bool {
  let accountIdentifier : Ledger.AccountIdentifier = accountIdentifierFromText(toAccount);

  let sendArgs : Ledger.TransferArgs = {
    to = accountIdentifier;
    fee = { e8s = 10_000 };
    memo = 0;
    from_subaccount = null;
    created_at_time = null;
    amount = { e8s = Nat64.fromNat(amountE8s) };
  };

  let result : Ledger.TransferResult = await ledgerCanister.transfer(sendArgs);

  switch (result) {
    case (#Ok(_)) {
      return true;
    };
    case (#Err(err)) {
      Debug.print("Transfer failed: " # debug_show (err));
      return false;
    };
  };
};

// Function to submit a contact message
public shared (msg) func submitContactMessage(email : Text, name : Text, messageText : Text) : async Bool {
  if (Text.size(messageText) > 420) {
    throw Error.reject("Message too long. Maximum length is 420 characters.");
  };
  let newMessage : ContactMessage = {
    id = contactMessageCounter;
    email = email;
    name = name;
    message = messageText;
    timestamp = Time.now();
  };
  contactMessages := Array.append(contactMessages, [newMessage]);
  contactMessageCounter := contactMessageCounter + 1;
  return true;
};

// Function to get contact messages (admin only)
public shared (msg) func getContactMessages() : async [ContactMessage] {
  let adminPID = Principal.fromText("rhqze-ri3xe-owyng-g4jwr-5f6ei-plpw2-nkai4-ndeas-feyik-3cyhx-pae");
  if (msg.caller != adminPID) {
    throw Error.reject("Access denied.");
  };
  return contactMessages;
};

// Function to delete a contact message (admin only)
public shared (msg) func deleteContactMessage(messageId : Nat) : async Bool {
  let adminPID = Principal.fromText("rhqze-ri3xe-owyng-g4jwr-5f6ei-plpw2-nkai4-ndeas-feyik-3cyhx-pae");
  if (msg.caller != adminPID) {
    return false;
  };
  let updatedMessages = Array.filter(contactMessages, func(m : ContactMessage) : Bool {
    m.id != messageId;
  });
  let success = Array.size(updatedMessages) < Array.size(contactMessages);
  if (success) {
    contactMessages := updatedMessages;
  };
  return success;
};



// New private function to distribute winnings internally
func distributeWinningsInternal(gameNumber : Nat) : async Bool {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      if (game.winner == null) {
        throw Error.reject("Cannot distribute winnings without a winner.");
      };
      if (game.completed) {
        throw Error.reject("Game has already been completed.");
      };

      // Total collected amount (after service fee)
      let totalCollected = (game.price * game.cardCount * 975) / 1000; 

      // Host's share
      let hostShare = (totalCollected * Nat16.toNat(game.hostPercentage)) / 1000;

      // Winnings
      let winnings = totalCollected - hostShare;

      var sendWinningsResult = false;

      switch (game.winner) {
        case (null) {
          throw Error.reject("Winner is unexpectedly null.");
        };
        case (?winner) {
          let winnerPrincipal = winner.principal;
          sendWinningsResult := await sendTokens(winnerPrincipal, winnings);
        };
      };

      // Send host's share to the host
      let hostPrincipal = game.hostPrincipalId;
      let sendHostResult = await sendTokens(hostPrincipal, hostShare);

      if (sendWinningsResult and sendHostResult) {
        // Mark game as completed
        let updatedGame = {
          game with
          completed = true;
        };
        updateGame(updatedGame);
        return true;
      } else {
        return false;
      };

    };
  };
};

// Function to distribute winnings (modified to handle optional winner)
public shared (msg) func distributeWinnings(gameNumber : Nat) : async Bool {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      if (game.completed) {
        throw Error.reject("Game has already been completed.");
      };
      if (game.winner == null) {
        throw Error.reject("Cannot distribute winnings without a winner.");
      };

      // Unwrap game.winner using switch
      switch (game.winner) {
        case null {
          throw Error.reject("Winner is unexpectedly null.");
        };
        case (?winner) {
          if (caller != game.hostPrincipalId and caller != winner.principal) {
            throw Error.reject("Only the host or the winner can distribute winnings.");
          };

          // Total collected amount (after service fee)
          let totalCollected = (game.price * game.cardCount * 975) / 1000; 

          // Host's share
          let hostShare = (totalCollected * Nat16.toNat(game.hostPercentage)) / 1000;

          // Winnings
          let winnings = totalCollected - hostShare;

          var sendWinningsResult = true;
          if (winnings > 0) {
            let winnerPrincipal = winner.principal;
            sendWinningsResult := await sendTokens(winnerPrincipal, winnings);
          };

          var sendHostResult = true;
          if (hostShare > 0) {
            let hostPrincipal = game.hostPrincipalId;
            sendHostResult := await sendTokens(hostPrincipal, hostShare);
          };

          if (sendWinningsResult and sendHostResult) {
            let updatedGame = {
              game with
              completed = true;
            };
            updateGame(updatedGame);
            return true;
          } else {
            return false;
          };
        };
      };
    };
  };
};

// Helper function to send tokens
func sendTokens(to_principal : Principal, amountE8s : Nat) : async Bool {
  if (amountE8s == 0) {
    return true; 
  };
  let sendArgs : TransferArgs = {
    to_principal = to_principal;
    to_subaccount = null;
    amount = { e8s = Nat64.fromNat(amountE8s) };
  };

  let result : Result = await icpTransferBackend.transfer(sendArgs);

  switch (result) {
    case (#Ok(_)) {
      return true;
    };
    case (#Err(err)) {
      Debug.print("Transfer failed: " # debug_show(err));
      return false;
    };
  };
};

// Helper function to convert Nat to Text
func natToText(n : Nat) : Text {
  var s = "";
  var num = n;
  if (num == 0) { return "0" };
  while (num > 0) {
    let digit = num % 10;
    let digit32 = Nat32.fromNat(48 + digit);
    let c = Char.fromNat32(digit32);
    s := Text.fromChar(c) # s;
    num := num / 10;
  };
  return s;
};

// Function to create a new game
public shared (msg) func createGame(
  gameName : Text,
  scheduledStartTime : Time.Time,
  winType : { #Blackout; #Standard },
  price : Nat,
  hostPercentage : Nat16,
  password : ?Text,
) : async Nat {
  if (hostPercentage > 1000) { 
    throw Error.reject("Host percentage cannot exceed 100%");
  };

  let caller = msg.caller;
  let newGameNumber = gameNumberCounter;
  gameNumberCounter := gameNumberCounter + 1;

  let newGame : Game = {
    gameNumber = newGameNumber;
    hostPrincipalId = caller;
    gameName = gameName;
    scheduledStartTime = scheduledStartTime;
    startTime = null;
    endTime = null;
    resetTime = null;
    playerCards = [];
    gameInProgress = false;
    calledNumbers = [];
    currentNumberIndex = 0;
    winner = null;
    winType = winType; 
    cardCount = 0;
    messages = [];
    price = price; 
    playersPaid = []; 
    hostPercentage = hostPercentage; 
    completed = false; 
    password = password; 
    lastNumberDrawTime = null; 
    hostAssignedTime = ?Time.now(); 
  };

  games := Array.append(games, [newGame]);

  return newGameNumber;
};

// Modify getActiveGames to include winType
public query func getActiveGames() : async [GameSummary] {
  return Array.map<Game, GameSummary>(
    games,
    func(game : Game) : GameSummary {
      return {
        gameNumber = game.gameNumber;
        gameName = game.gameName;
        scheduledStartTime = game.scheduledStartTime;
        hostPrincipalId = game.hostPrincipalId;
        gameInProgress = game.gameInProgress;
        winner = game.winner;
        cardCount = game.cardCount;
        price = game.price; 
        hostPercentage = game.hostPercentage; 
        completed = game.completed; 
        passwordProtected = game.password != null; 
        startTime = game.startTime; 
        lastNumberDrawTime = game.lastNumberDrawTime; 
        hostAssignedTime = game.hostAssignedTime; 
        winType = game.winType;
      };
    },
  );
};

// Function to find a game by gameNumber
func findGame(gameNumber : Nat) : ?Game {
  Array.find<Game>(
    games,
    func(game : Game) : Bool {
      game.gameNumber == gameNumber;
    },
  );
};

// Function to update a game in the games array
func updateGame(updatedGame : Game) : () {
  games := Array.map<Game, Game>(
    games,
    func(game : Game) : Game {
      if (game.gameNumber == updatedGame.gameNumber) {
        return updatedGame;
      } else {
        return game;
      };
    },
  );
};

// Helper functions for card generation
func generateBingoCard(seed : Nat) : [Nat] {
  var currentSeed = seed;

  let (bColumn, seed1) = pickRandomNumbers(1, 15, 5, currentSeed);
  currentSeed := seed1;

  let (iColumn, seed2) = pickRandomNumbers(16, 30, 5, currentSeed);
  currentSeed := seed2;

  // N column with free space in the middle
  let (nNumbers, seed3) = pickRandomNumbers(31, 45, 4, currentSeed);
  currentSeed := seed3;
  let nColumn = [nNumbers[0], nNumbers[1], 0, nNumbers[2], nNumbers[3]];

  let (gColumn, seed4) = pickRandomNumbers(46, 60, 5, currentSeed);
  currentSeed := seed4;

  let (oColumn, seed5) = pickRandomNumbers(61, 75, 5, currentSeed);
  currentSeed := seed5;

  // Now, construct the card in row-major order
  let columns = [bColumn, iColumn, nColumn, gColumn, oColumn];

  var cardNumbers : [Nat] = [];

  for (row in Iter.range(0, 4)) {
    // Rows 0 to 4
    for (col in Iter.range(0, 4)) {
      // Columns 0 to 4
      cardNumbers := Array.append<Nat>(cardNumbers, [columns[col][row]]);
    };
  };

  return cardNumbers;
};

func pickRandomNumbers(min : Nat, max : Nat, count : Nat, seed : Nat) : ([Nat], Nat) {
  var numbers = Array.tabulate<Nat>(max - min + 1, func(i : Nat) : Nat { min + i });
  let (shuffledNumbers, newSeed) = shuffle(numbers, seed);
  let selectedNumbers = Array.subArray<Nat>(shuffledNumbers, 0, count);
  return (selectedNumbers, newSeed);
};

func shuffle(arr : [Nat], seed : Nat) : ([Nat], Nat) {
  var a = Array.thaw<Nat>(arr);
  let len = a.size();
  var i = len;
  var currentSeed = seed;
  while (i > 1) {
    i := i - 1;
    currentSeed := lcg(currentSeed);
    let j = currentSeed % (i + 1);
    // Swap a[i] and a[j]
    let temp = a[i];
    a[i] := a[j];
    a[j] := temp;
  };
  return (Array.freeze<Nat>(a), currentSeed);
};

func lcg(seed : Nat) : Nat {
  let a = 48271;
  let m = 2147483647;
  return (a * seed) % m;
};

// Function to generate a Bingo card for a user in a specific game
public shared (msg) func generateCard(gameNumber : Nat) : async [Nat] {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      // Check if the user has paid
      let hasPaid = Array.find(game.playersPaid, func(p : Principal) : Bool { p == caller }) != null;
      if (not hasPaid and game.price > 0) {
        throw Error.reject("You must pay the required amount to join this game.");
      };

      // Check if the user already has a card in this game
      let existingCard = Array.find(
        game.playerCards,
        func(entry : (Principal, [Nat])) : Bool {
          entry.0 == caller;
        },
      );

      switch (existingCard) {
        case (?card) {
          if (Array.size(card.1) == 25) {
            return card.1;
          } else {
            Debug.print("Card exists but data is invalid.");
            throw Error.reject("Existing card data is invalid.");
          };
        };
        case null {
          // Generate a new card with a unique seed based on the caller's principal ID and game number
          let seedText = Principal.toText(caller) # natToText(game.gameNumber);
          let seed = Nat32.toNat(Text.hash(seedText));
          let newCard = generateBingoCard(seed);

          // Store the new card
          let updatedPlayerCards = Array.append(game.playerCards, [(caller, newCard)]);
          let updatedGame = {
            game with
            playerCards = updatedPlayerCards;
            cardCount = game.cardCount + 1;
          };
          updateGame(updatedGame);

          return newCard;
        };
      };
    };
  };
};

// Function to get the price of a game
public query func getGamePrice(gameNumber : Nat) : async Nat {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return 0 };
    case (?game) { return game.price };
  };
};

// Function to get the host percentage of a game
public query func getHostPercentage(gameNumber : Nat) : async Nat16 {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return 0 };
    case (?game) { return game.hostPercentage };
  };
};

// Function to check if a user has paid for a game
public query func hasUserPaid(gameNumber : Nat, user : Principal) : async Bool {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return false };
    case (?game) {
      return Array.find(game.playersPaid, func(p : Principal) : Bool { p == user }) != null;
    };
  };
};

// Function to record a payment by a user for a game (Modified to accept password)
public shared (msg) func recordPayment(gameNumber : Nat, password : ?Text) : async Bool {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      // Check password
      switch (game.password) {
        case null { /* No password required */ };
        case (?gamePassword) {
          switch (password) {
            case null {
              throw Error.reject("Password required to join this game.");
            };
            case (?providedPassword) {
              if (providedPassword != gamePassword) {
                throw Error.reject("Incorrect password.");
              };
            };
          };
        };
      };

      if (Array.find(game.playersPaid, func(p : Principal) : Bool { p == caller }) != null) {
        // User has already paid
        return false;
      };

      // Add user to playersPaid
      let updatedPlayersPaid = Array.append(game.playersPaid, [caller]);
      let updatedGame = {
        game with
        playersPaid = updatedPlayersPaid;
      };
      updateGame(updatedGame);
      return true;
    };
  };
};

// Function to verify the game password
public shared func verifyGamePassword(gameNumber : Nat, password : Text) : async Bool {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return false };
    case (?game) {
      switch (game.password) {
        case null { return true }; // Game has no password
        case (?gamePassword) {
          return gamePassword == password;
        };
      };
    };
  };
};

// Function to start the game (only the host can start their game)
public shared (msg) func startGame(gameNumber : Nat) : async () {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      if (caller != game.hostPrincipalId) {
        throw Error.reject("Only the host can start the game.");
      };
      if (not game.gameInProgress and game.winner == null and game.playerCards.size() > 0) {
        let playerIdsText = Array.foldLeft(
          game.playerCards,
          "",
          func(acc : Text, entry : (Principal, [Nat])) : Text {
            acc # Principal.toText(entry.0);
          },
        ) # natToText(game.gameNumber);
        let seed = Nat32.toNat(Text.hash(playerIdsText));
        let calledNumbers = generateCalledNumbers(seed);

        let updatedGame = {
          game with
          gameInProgress = true;
          calledNumbers = calledNumbers;
          currentNumberIndex = 0;
          startTime = ?Time.now(); 
        };
        updateGame(updatedGame);
      } else {
        if (game.playerCards.size() == 0) {
          throw Error.reject("Cannot start game without players.");
        };
      };
    };
  };
};

// Function to generate called numbers for the game
func generateCalledNumbers(seed : Nat) : [Nat] {
  // Generate numbers from 1 to 75
  let numbers = Array.tabulate<Nat>(75, func(i : Nat) : Nat { i + 1 });
  // Shuffle the numbers
  let (shuffledNumbers, _) = shuffle(numbers, seed);
  return shuffledNumbers;
};

// Function to set the win type (deprecated in frontend but kept for future use)
public shared (msg) func setWinType(gameNumber : Nat, newWinType : { #Blackout; #Standard }) : async () {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      if (caller != game.hostPrincipalId) {
        throw Error.reject("Only the host can set the win type.");
      };
      if (game.gameInProgress) {
        throw Error.reject("Cannot change win type during a game.");
      };
      let updatedGame = {
        game with
        winType = newWinType;
      };
      updateGame(updatedGame);
      Debug.print("Win type set to: " # variantToText(newWinType));
    };
  };
};

// Function to get the win type of a game
public query func getWinType(gameNumber : Nat) : async { #Blackout; #Standard } {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return #Blackout }; 
    case (?game) { return game.winType };
  };
};

// Function to convert winType variant to Text
func variantToText(v : { #Blackout; #Standard }) : Text {
  switch v {
    case (#Blackout) { "Blackout" };
    case (#Standard) { "Standard" };
  };
};

// Function to draw the next number (only the host can do this)
public shared (msg) func drawNextNumber(gameNumber : Nat) : async () {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      if (caller != game.hostPrincipalId) {
        throw Error.reject("Only the host can draw the next number.");
      };
      if (game.gameInProgress and game.winner == null) {
        if (game.currentNumberIndex < game.calledNumbers.size()) {
          let newIndex = game.currentNumberIndex + 1;
          let updatedGame = {
            game with
            currentNumberIndex = newIndex;
            lastNumberDrawTime = ?Time.now(); 
          };
          updateGame(updatedGame);
        } else {
          throw Error.reject("All numbers have been drawn. The game is over.");
        };
      } else {
        throw Error.reject("Game is not in progress or a winner has been declared.");
      };
    };
  };
};

// Function to check if the game is in progress
public query func isGameInProgress(gameNumber : Nat) : async Bool {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return false };
    case (?game) { return game.gameInProgress };
  };
};

// Function to get the latest called number
public query func getLatestNumber(gameNumber : Nat) : async ?Nat {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return null };
    case (?game) {
      if (game.currentNumberIndex > 0 and game.currentNumberIndex <= game.calledNumbers.size()) {
        return ?game.calledNumbers[game.currentNumberIndex - 1];
      } else {
        return null;
      };
    };
  };
};

// Function to get the numbers called so far
public query func getCalledNumbers(gameNumber : Nat) : async [Nat] {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return [] };
    case (?game) {
      return Array.subArray<Nat>(game.calledNumbers, 0, game.currentNumberIndex);
    };
  };
};

// Helper function to get called numbers internally
func getCalledNumbersInternal(gameNumber : Nat) : [Nat] {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return [] };
    case (?game) {
      return Array.subArray<Nat>(game.calledNumbers, 0, game.currentNumberIndex);
    };
  };
};

// Helper function to get username internally
func getUsernameInternal(principal : Principal) : ?Text {
  let user = Array.find<UsernameEntry>(
    usernames,
    func(entry : UsernameEntry) : Bool {
      return entry.principal == principal;
    },
  );
  switch (user) {
    case (?entry) { return ?entry.username };
    case (_) { return null };
  };
};

// **Updated**: Function to check if the player has won (now returns CheckWinResult variant)
public shared (msg) func checkWin(gameNumber : Nat, markedCells : [Bool]) : async CheckWinResult {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return #NotWon };
    case (?game) {
      if (game.winner != null) {
        return #GameAlreadyWon;
      };

      // Get the user's card
      let foundCard = Array.find(
        game.playerCards,
        func(entry : (Principal, [Nat])) : Bool {
          entry.0 == caller;
        },
      );
      switch (foundCard) {
        case (?entry) {
          let card = entry.1;

          // Ensure card and markedCells have the same length (25)
          if (Array.size(card) != 25 or Array.size(markedCells) != 25) {
            return #NotWon; 
          };

          // Get the called numbers internally
          let numbersCalled = getCalledNumbersInternal(gameNumber);

          // Proceed to check if the user has won
          var hasWon : Bool = false;
          switch (game.winType) {
            case (#Blackout) {
              hasWon := checkBlackoutBingo(card, numbersCalled, markedCells);
            };
            case (#Standard) {
              hasWon := checkStandardBingo(card, numbersCalled, markedCells);
            };
          };

          if (hasWon) {
            // Double-check if the winner is still null
            let updatedGameOpt = findGame(gameNumber);
            switch (updatedGameOpt) {
              case null { return #NotWon };
              case (?updatedGame) {
                if (updatedGame.winner != null) {
                  return #GameAlreadyWon;
                };

                let callerUsernameOpt = getUsernameInternal(caller);

                // Set the winner
                let winnerInfo = ?{
                  principal = caller;
                  username = callerUsernameOpt;
                };
                let updatedGameFinal = {
                  updatedGame with
                  winner = winnerInfo;
                  gameInProgress = false;
                  endTime = ?Time.now();
                  completed = false; 
                };
                updateGame(updatedGameFinal);
                let callerDisplayName = switch (callerUsernameOpt) {
                  case (?name) name;
                  case null Principal.toText(caller);
                };
                Debug.print("Winner found: " # callerDisplayName);
                return #Won;
              };
            };
          } else {
            return #NotWon;
          };
        };
        case null { return #NotWon };
      };
    };
  };
};

// Helper function to check for blackout bingo (full card)
func checkBlackoutBingo(card : [Nat], numbersCalled : [Nat], markedCells : [Bool]) : Bool {
  for (i in Iter.range(0, Array.size(card)-1)) {
    let n = card[i];
    if (n != 0) {
      if (not arrayContains(numbersCalled, n)) {
        return false;
      };
      if (not markedCells[i]) {
        return false;
      };
    }
  };
  return true;
};

// Helper function to check for standard bingo (5 in a row)
func checkStandardBingo(card : [Nat], numbersCalled : [Nat], markedCells : [Bool]) : Bool {
  // Convert card to 5x5 grid
  let grid = Array.tabulate<[Nat]>(
    5,
    func(row : Nat) : [Nat] {
      Array.subArray<Nat>(card, row * 5, 5);
    },
  );

  // Also map markedCells into a 5x5 grid
  let markedGrid = Array.tabulate<[Bool]>(
    5,
    func(row : Nat) : [Bool] {
      Array.subArray<Bool>(markedCells, row * 5, 5);
    },
  );

  // Helper function to check if a line is a winning line
  func isWinningLine(line : [Nat], lineMarked : [Bool]) : Bool {
    for (i in Iter.range(0, Array.size(line)-1)) {
      let n = line[i];
      let marked = lineMarked[i];
      if (n != 0) {
        if (not arrayContains(numbersCalled, n)) {
          return false;
        };
        if (not marked) {
          return false;
        };
      }
    };
    return true;
  };

  // Check rows
  for (r in Iter.range(0,4)) {
    if (isWinningLine(grid[r], markedGrid[r])) {
      return true;
    }
  };

  // Check columns
  for (col in Iter.range(0,4)) {
    var columnNumbers : [Nat] = [];
    var columnMarked : [Bool] = [];
    for (row in Iter.range(0,4)) {
      columnNumbers := Array.append<Nat>(columnNumbers, [grid[row][col]]);
      columnMarked := Array.append<Bool>(columnMarked, [markedGrid[row][col]]);
    };
    if (isWinningLine(columnNumbers, columnMarked)) {
      return true;
    }
  };

  // Check diagonals
  var diagonal1 : [Nat] = [];
  var diagonal1Marked : [Bool] = [];
  var diagonal2 : [Nat] = [];
  var diagonal2Marked : [Bool] = [];

  for (i in Iter.range(0,4)) {
    diagonal1 := Array.append<Nat>(diagonal1, [grid[i][i]]);
    diagonal1Marked := Array.append<Bool>(diagonal1Marked, [markedGrid[i][i]]);

    diagonal2 := Array.append<Nat>(diagonal2, [grid[i][4 - i]]);
    diagonal2Marked := Array.append<Bool>(diagonal2Marked, [markedGrid[i][4 - i]]);
  };

  if (isWinningLine(diagonal1, diagonal1Marked)) {
    return true;
  };
  if (isWinningLine(diagonal2, diagonal2Marked)) {
    return true;
  };

  return false;
};

// Helper function to check if an array contains a value
func arrayContains(arr : [Nat], value : Nat) : Bool {
  for (i in arr.vals()) {
    if (i == value) {
      return true;
    };
  };
  return false;
};

// Helper function to check if all elements satisfy a predicate
func arrayAll(arr : [Nat], predicate : Nat -> Bool) : Bool {
  for (i in arr.vals()) {
    if (not predicate(i)) {
      return false;
    };
  };
  return true;
};

// Function to mark game as completed (only the host can do this)
public shared (msg) func markGameCompleted(gameNumber : Nat) : async () {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      if (caller != game.hostPrincipalId) {
        throw Error.reject("Only the host can mark the game as completed.");
      };
      if (not (game.winner != null)) {
        throw Error.reject("Cannot mark a game as completed that has no winner.");
      };
      let updatedGame = {
        game with
        completed = true;
      };
      updateGame(updatedGame);
      Debug.print("Game marked as completed by host: " # Principal.toText(caller));
    };
  };
};

// Function for users to set their username
public shared (msg) func setUsername(newUsername : Text) : async Bool {
  let caller = msg.caller;
  let lowerUsername = Text.toLowercase(newUsername);

  // Check if username already exists (case-insensitive)
  if (
    Array.find(
      usernames,
      func(entry : UsernameEntry) : Bool {
        Text.toLowercase(entry.username) == lowerUsername;
      },
    ) != null
  ) {
    return false;
  };

  // Update or add the username
  usernames := Array.filter(usernames, func(entry : UsernameEntry) : Bool { return entry.principal != caller });
  usernames := Array.append<UsernameEntry>(usernames, [{ principal = caller; username = newUsername; timestamp = Time.now() }]);

  return true;
};

// Function to get username for a principal
public query func getUsername(principal : Principal) : async ?Text {
  let user = Array.find<UsernameEntry>(
    usernames,
    func(entry) : Bool {
      return entry.principal == principal;
    },
  );
  switch (user) {
    case (?entry) { return ?entry.username };
    case (_) { return null };
  };
};

// Function for users to get their own Principal ID
public shared (msg) func whoAmI() : async Principal {
  return msg.caller;
};

// Function to get the host's Principal ID
public query func getHostPrincipal(gameNumber : Nat) : async Principal {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { Principal.fromText("2vxsx-fae") };
    case (?game) { game.hostPrincipalId };
  };
};

// Function to get the winner's information for a game
public query func getWinner(gameNumber : Nat) : async ?Winner {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return null };
    case (?game) { return game.winner };
  };
};

// Function to get the game name
public query func getGameName(gameNumber : Nat) : async ?Text {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return null };
    case (?game) { return ?game.gameName };
  };
};

// Function to get the card count for a game
public query func getCardCount(gameNumber : Nat) : async Nat {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return 0 };
    case (?game) { return game.cardCount };
  };
};

// Chatroom Functions
public shared (msg) func sendMessage(text : Text, gameNumber : Nat) : async () {
  let caller = msg.caller;
  let usernameOpt = await getUsername(caller);
  let username : Text = switch (usernameOpt) {
    case (?name) name;
    case null Principal.toText(caller);
  };

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      let newMessage : Message = {
        username = username;
        text = text;
        timestamp = Time.now();
        gameNumber = gameNumber;
      };
      let updatedMessages = Array.append<Message>(game.messages, [newMessage]);
      let updatedGame = {
        game with
        messages = updatedMessages;
      };
      updateGame(updatedGame);
    };
  };
};

stable var lobbyMessages : [Message] = [];

// Function to send a message to the lobby
public shared (msg) func sendLobbyMessage(text : Text) : async () {
  let caller = msg.caller;

  if (Text.size(text) > 420) {
    throw Error.reject("Message too long. Maximum length is 420 characters.");
  };

  let usernameOpt = await getUsername(caller);
  let username : Text = switch (usernameOpt) {
    case (?name) name;
    case null Principal.toText(caller);
  };

  let newMessage : Message = {
    username = username;
    text = text;
    timestamp = Time.now();
    gameNumber = 0; 
  };

  lobbyMessages := Array.append<Message>(lobbyMessages, [newMessage]);
};

// Function to get lobby messages
public query func getLobbyMessages() : async [Message] {
  return lobbyMessages;
};

// Function to delete a lobby message
public shared (msg) func deleteLobbyMessage(timestamp : Time.Time) : async Bool {
  let caller = msg.caller;
  let adminPID = Principal.fromText("rhqze-ri3xe-owyng-g4jwr-5f6ei-plpw2-nkai4-ndeas-feyik-3cyhx-pae");

  if (caller != adminPID) {
    return false;
  };

  let updatedMessages = Array.filter<Message>(
    lobbyMessages,
    func(m : Message) : Bool {
      not (m.timestamp == timestamp);
    },
  );

  let success = Array.size(updatedMessages) < Array.size(lobbyMessages);
  if (success) {
    lobbyMessages := updatedMessages;
  };

  return success;
};

// Function to get messages for a specific game
public query func getMessages(gameNumber : Nat) : async [Message] {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return [] };
    case (?game) {
      return game.messages;
    };
  };
};

public shared (msg) func deleteMessage(timestamp : Time.Time, gameNumber : Nat) : async Bool {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return false };
    case (?game) {
      if (caller == game.hostPrincipalId) {
        let updatedMessages = Array.filter<Message>(
          game.messages,
          func(m : Message) : Bool {
            not (m.timestamp == timestamp and m.gameNumber == gameNumber);
          },
        );
        let updatedGame = {
          game with
          messages = updatedMessages;
        };
        updateGame(updatedGame);
        return true;
      } else {
        return false;
      };
    };
  };
};

// Function to reset the game (only the host can reset their game)
public shared (msg) func resetGame(gameNumber : Nat) : async () {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      if (caller != game.hostPrincipalId) {
        throw Error.reject("Only the host can reset the game.");
      };
      if (game.winner != null) {
        throw Error.reject("Cannot reset a game that has already been won.");
      };
      let updatedGame = {
        game with
        playerCards = [];
        gameInProgress = false;
        calledNumbers = [];
        currentNumberIndex = 0;
        cardCount = 0;
        resetTime = ?Time.now();
        messages = [];
        playersPaid = []; 
      };
      updateGame(updatedGame);
      Debug.print("Game has been reset by host: " # Principal.toText(caller));
    };
  };
};

// Function to check if a user has a card in a specific game
public query func hasCard(gameNumber : Nat, user : Principal) : async Bool {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return false };
    case (?game) {
      return Array.find(
        game.playerCards,
        func(entry : (Principal, [Nat])) : Bool {
          entry.0 == user;
        },
      ) != null;
    };
  };
};

// Function to retrieve a user's card in a specific game
public query func getMyCard(gameNumber : Nat, user : Principal) : async ?[Nat] {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return null };
    case (?game) {
      let cardOpt = Array.find(
        game.playerCards,
        func(entry : (Principal, [Nat])) : Bool {
          entry.0 == user;
        },
      );
      switch (cardOpt) {
        case null { return null };
        case (?card) { return ?card.1 };
      };
    };
  };
};

// **Updated areAllNumbersDrawn Function**
public query func areAllNumbersDrawn(gameNumber : Nat) : async Bool {
  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { return false };
    case (?game) {
      if (not game.gameInProgress or game.calledNumbers.size() == 0) {
        return false;
      };
      return game.currentNumberIndex >= game.calledNumbers.size();
    };
  };
};

// User Agreement Tracking

stable var userAgreements : [(Principal, Time.Time)] = [];

public shared (msg) func recordUserAgreement() : async () {
  let caller = msg.caller;
  let now = Time.now();
  userAgreements := Array.filter(userAgreements, func(entry : (Principal, Time.Time)) : Bool {
    entry.0 != caller
  });
  userAgreements := Array.append(userAgreements, [(caller, now)]);
};

public shared query(msg) func getLastUserAgreement() : async ?Time.Time {
  let caller = msg.caller;
  let entryOpt = Array.find(userAgreements, func(entry : (Principal, Time.Time)) : Bool {
    entry.0 == caller
  });
  switch (entryOpt) {
    case null { return null };
    case (?entry) { return ?entry.1 };
  };
};

// Updated Function: Become Host
public shared (msg) func becomeHost(gameNumber : Nat) : async Bool {
  let caller = msg.caller;

  let gameOpt = findGame(gameNumber);
  switch (gameOpt) {
    case null { throw Error.reject("Game not found.") };
    case (?game) {
      let now = Time.now();
      let fiveMinutesInNs = 300_000_000_000; 

      if (game.winner != null) {
        throw Error.reject("Cannot become host for a game that already has a winner.");
      };

      if (game.hostPrincipalId == caller) {
        throw Error.reject("You are already the host.");
      };

      // Check if five minutes have passed since last host assignment
      switch (game.hostAssignedTime) {
        case (?hostTime) {
          if (now < hostTime + fiveMinutesInNs) {
            throw Error.reject("Another user has already been assigned as host for this game.");
          };
        };
        case null {
        };
      };

      // Update the hostPrincipalId to caller and set hostAssignedTime
      let updatedGame = {
        game with
        hostPrincipalId = caller;
        hostAssignedTime = ?now; 
      };
      updateGame(updatedGame);

      Debug.print("Host has been transferred to: " # Principal.toText(caller));
      return true;
    };
  };
};
};
