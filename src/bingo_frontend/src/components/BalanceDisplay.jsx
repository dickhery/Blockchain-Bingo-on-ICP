// src/bingo_frontend/src/components/BalanceDisplay.jsx

import React, { useRef, useEffect, useState } from 'react';
import DOMPurify from 'dompurify'; 
import { HttpAgent } from '@dfinity/agent';
import { LedgerCanister, AccountIdentifier } from '@dfinity/ledger-icp';
import { Principal } from '@dfinity/principal';
import { Buffer } from 'buffer'; 
import './BalanceDisplay.scss';

function BalanceDisplay({ authClient }) {
  const [balanceICP, setBalanceICP] = useState(0.0);
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Initialize LedgerCanister
  const ledgerCanister = useRef(null);

  useEffect(() => {
    if (authClient) {
      initializeLedgerInstance();
    }
  }, [authClient]);

  const initializeLedgerInstance = async () => {
    const identity = await authClient.getIdentity();

    // Create a new HttpAgent with the correct host
    const agent = new HttpAgent({
      identity,
      host: 'https://ic0.app',
    });

    // Fetch root key during development
    if (process.env.NODE_ENV !== 'production') {
      await agent.fetchRootKey();
    }

    ledgerCanister.current = LedgerCanister.create({
      agent,
      canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai', 
    });

    // Set the user's account identifier
    const userPrincipal = identity.getPrincipal();
    const userAccount = AccountIdentifier.fromPrincipal({ principal: userPrincipal });

    // Verify the account identifier
    console.log('Generated Account Identifier:', userAccount.toHex());
    setAccountIdentifier(userAccount.toHex());

    // Fetch the balance after initializing
    fetchBalance();
  };

  const fetchBalance = async () => {
    try {
      setIsFetching(true);
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal();
      const userAccount = AccountIdentifier.fromPrincipal({ principal: userPrincipal });

      const balanceE8s = await ledgerCanister.current.accountBalance({
        accountIdentifier: userAccount,
        certified: true,
      });

      // Convert e8s to ICP (handling BigInt)
      const balanceNumber = Number(balanceE8s.toString()) / 100_000_000;

      setBalanceICP(isNaN(balanceNumber) ? 0 : balanceNumber);
    } catch (error) {
      console.error('Error fetching balance:', error);
      alert('Failed to fetch balance.');
      setBalanceICP(0); 
    } finally {
      setIsFetching(false);
    }
  };

  const handleTransfer = async () => {
    if (!authClient) return;
    if (!recipient || !transferAmount) {
      alert('Please provide recipient and amount.');
      return;
    }

    try {
      setIsTransferring(true);
      const identity = await authClient.getIdentity();
      const senderPrincipal = identity.getPrincipal();

      // Convert ICP to e8s
      const amountE8s = BigInt(parseFloat(transferAmount) * 100_000_000);

      // Fetch user's balance
      const userAccount = AccountIdentifier.fromPrincipal({ principal: senderPrincipal });
      const userBalanceE8s = await ledgerCanister.current.accountBalance({
        accountIdentifier: userAccount,
        certified: true,
      });

      // Check if user has sufficient balance
      const totalAmount = amountE8s + BigInt(10_000); 
      if (userBalanceE8s < totalAmount) {
        alert('Insufficient balance to complete the transfer.');
        setIsTransferring(false);
        return;
      }

      // Determine if recipient is a Principal or Account Identifier
      let recipientAccount;
      if (recipient.length === 64 || recipient.length === 64 + 1) {
        // Assume it's an Account Identifier
        recipientAccount = AccountIdentifier.fromHex(recipient);
      } else {
        // Try to parse as Principal
        let recipientPrincipal;
        try {
          recipientPrincipal = Principal.fromText(recipient);
        } catch (e) {
          alert('Invalid recipient Principal ID or Account Identifier.');
          setIsTransferring(false);
          return;
        }
        recipientAccount = AccountIdentifier.fromPrincipal({ principal: recipientPrincipal });
      }

      const memo = BigInt(0); // You can customize the memo

      // Initiate transfer
      const txId = await ledgerCanister.current.transfer({
        to: recipientAccount,
        fee: BigInt(10_000), 
        memo: memo,
        amount: amountE8s,
        fromSubAccount: undefined,
        createdAt: undefined,
      });

      console.log('Transfer Transaction ID:', txId);
      alert(`Transfer successful! Transaction ID: ${txId}`);

      // Refresh balance
      await fetchBalance();
      setTransferAmount('');
      setRecipient('');
    } catch (error) {
      console.error('Error during transfer:', error);
      alert(`Transfer failed: ${error.message || error}`);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="balance-display">
      <h3>Your ICP Balance</h3>
      {isFetching ? (
        <p>Loading balance...</p>
      ) : (
        <p>{balanceICP.toFixed(8)} ICP</p>
      )}
      <button onClick={fetchBalance} disabled={isFetching}>
        Refresh Balance
      </button>
      <div className="account-identifier">
        <h4>Your Account Identifier</h4>
        <p>{DOMPurify.sanitize(accountIdentifier)}</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(accountIdentifier);
            alert('Account Identifier copied to clipboard.');
          }}
        >
          Copy Account Identifier
        </button>
        <p>Send ICP to your account identifier or the Principal ID listed at the bottom of the page to fund your account.</p>
      </div>
      <div className="transfer-section">
        <h4>Transfer ICP</h4>
        <input
          type="text"
          placeholder="Recipient Principal ID or Account Identifier"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <input
          type="number"
          placeholder="Amount (ICP)"
          value={transferAmount}
          onChange={(e) => setTransferAmount(e.target.value)}
          min="0"
          step="0.01"
        />
        <button onClick={handleTransfer} disabled={isTransferring}>
          {isTransferring ? 'Transferring...' : 'Transfer'}
        </button>
      </div>
    </div>
  );
}

export default BalanceDisplay;
