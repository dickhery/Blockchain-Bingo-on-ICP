// src/bingo_frontend/src/utils.js

import { LedgerCanister, AccountIdentifier } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';

/**
 * Get the account identifier for a principal with an optional sub-account.
 * @param {Principal} principal 
 * @param {Uint8Array} [subAccount] 
 * @returns {AccountIdentifier}
 */
export function getAccountIdentifier(principal, subAccount = null) {
  return AccountIdentifier.fromPrincipal({ principal, subAccount });
}

/**
 * Convert ICP to e8s (1 ICP = 100,000,000 e8s)
 * @param {string} icpAmount - The amount in ICP as a string
 * @returns {bigint} - The amount in e8s as a bigint
 */
export function icpToE8s(icpAmount) {
  const [whole, fraction = '0'] = icpAmount.split('.');
  const fractionPadded = (fraction + '00000000').slice(0, 8);
  return BigInt(whole) * BigInt(100_000_000) + BigInt(fractionPadded);
}

/**
 * Convert e8s to ICP.
 * @param {bigint} e8s 
 * @returns {number}
 */
export function e8sToIcp(e8s) {
  return Number(e8s) / 100_000_000;
}

/**
 * Initialize the LedgerCanister.
 * @param {any} agent - The HttpAgent instance.
 * @returns {LedgerCanister}
 */
export function initializeLedger(agent) {
  return LedgerCanister.create({
    agent,
    canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai', 
  });
}

/**
 * Retrieves the corresponding Bingo letter for a given number.
 * @param {number} number 
 * @returns {string}
 */
export function getLetterForNumber(number) {
  if (number >= 1 && number <= 15) return 'B';
  else if (number >= 16 && number <= 30) return 'I';
  else if (number >= 31 && number <= 45) return 'N';
  else if (number >= 46 && number <= 60) return 'G';
  else if (number >= 61 && number <= 75) return 'O';
  else return '';
}

// Audio Cache Implementation
export const audioBufferCache = {};

/**
 * Fetches and decodes an audio file.
 * Caches the decoded AudioBuffer for future use.
 * @param {AudioContext} audioContext
 * @param {string} audioFilePath - Path to the audio file (e.g., '/audio/B1.mp3')
 * @returns {Promise<AudioBuffer|null>}
 */
export async function fetchAndDecodeAudio(audioContext, audioFilePath) {
  if (audioBufferCache[audioFilePath]) {
    return audioBufferCache[audioFilePath];
  }
  try {
    const response = await fetch(audioFilePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio file: ${audioFilePath}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioBufferCache[audioFilePath] = audioBuffer;
    return audioBuffer;
  } catch (error) {
    console.error(`Error fetching or decoding audio file ${audioFilePath}:`, error);
    return null;
  }
}

/**
 * Preloads all audio files into the audioBufferCache.
 * This helps in reducing latency during playback.
 * @param {AudioContext} audioContext - The AudioContext to use for decoding audio
 */
export function preloadAudioFiles(audioContext) {
  const letters = ['B', 'I', 'N', 'G', 'O'];
  for (let letter of letters) {
    for (let number = 1; number <= 75; number++) {
      // Validate number range per letter
      if (
        (letter === 'B' && number <= 15) ||
        (letter === 'I' && number >= 16 && number <= 30) ||
        (letter === 'N' && number >= 31 && number <= 45) ||
        (letter === 'G' && number >= 46 && number <= 60) ||
        (letter === 'O' && number >= 61 && number <= 75)
      ) {
        const audioFile = `${letter}${number}.mp3`;
        // Preload and cache the audio files
        fetchAndDecodeAudio(audioContext, `/audio/${audioFile}`);
      }
    }
  }
}

/**
 * Retrieves a cached AudioBuffer if available.
 * @param {string} letter - The Bingo letter (B, I, N, G, O)
 * @param {number} number - The Bingo number
 * @returns {AudioBuffer|null}
 */
export function getCachedAudio(letter, number) {
  const audioFile = `${letter}${number}.mp3`;
  return audioBufferCache[audioFile] || null;
}

/**
 * Generate a 32-byte subaccount identifier based on the game number.
 * @param {Nat} gameNumber
 * @returns {Uint8Array}
 */
export function getSubAccount(gameNumber) {
  const buffer = new ArrayBuffer(32);
  const view = new DataView(buffer);
  const gameNumberBigInt = BigInt(gameNumber);
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, Number((gameNumberBigInt >> BigInt(56 - 8 * i)) & BigInt(0xff)));
  }
  return new Uint8Array(buffer);
}
