// src/bingo_frontend/src/components/About.jsx

import React from 'react';
import './About.scss';

function About() {
  return (
    <div className="about-screen">
      <h1>About Blockchain Bingo</h1>
      
      {/* Introduction Section */}
      <section className="introduction">
        <p>
          Welcome to <strong>Blockchain Bingo</strong>, a decentralized application deployed on the Internet Computer Protocol (ICP) blockchain. Our platform allows users to enjoy interactive Bingo games for free from any location where online Bingo is permitted, as well as play for ICP in regions where it's allowed.
        </p>
      </section>
      
      {/* Key Features Section */}
      <section className="features">
        <h2>Key Features</h2>
        <ul>
          <li>
            <strong>Secure Authentication:</strong> Log in effortlessly using Internet Identity, ensuring your account is safe and secure.
          </li>
          <li>
            <strong>Play or Host Games:</strong> Join existing Bingo games for free or ICP, or host your own games with customizable settings.
          </li>
          <li>
            <strong>Customizable Hosting Options:</strong> As a host, you can set the game name, entry price, win type (Standard or Blackout), and the percentage of the pot you wish to retain.
          </li>
          <li>
            <strong>Real-Time Chat Rooms:</strong> Each game has its own dedicated chat room where players and hosts can communicate and strategize.
          </li>
          <li>
            <strong>ICP Balance Management:</strong> View your ICP balance, transfer funds to other users, and manage your account seamlessly within the app.
          </li>
          <li>
            <strong>Geoblocking:</strong> Ensure compliance with regional regulations by enabling geoblocking, preventing unauthorized access to paid games.
            <ul>
              <li><strong>Currently Blocked Countries:</strong> Bangladesh, Israel, Poland, Russia, Singapore, United Arab Emirates, Indonesia.</li>
              <li><strong>Currently Blocked US States:</strong> Illinois, Indiana, Louisiana, Michigan, Nevada, New York, Oregon, South Dakota, Washington, Wisconsin.</li>
              <li>If your region is not listed but bingo is restricted, please report it using the in-game <strong>Contact</strong> button to help us enhance our geoblocking features.</li>
            </ul>
          </li>
          <li>
            <strong>Responsive Design:</strong> Enjoy a seamless gaming experience across all devices, whether you're on a desktop, tablet, or mobile.
          </li>
          <li>
            <strong>Audio Features:</strong> Enable audio to hear numbers being called out during the game, enhancing the immersive experience.
          </li>
        </ul>
      </section>
      
      {/* Game Types Section */}
      <section className="game-types">
        <h2>Game Types</h2>
        <p>
          <strong>Blockchain Bingo</strong> offers two exciting game types: <em>Standard</em> and <em>Blackout</em>. Each game type provides a unique Bingo experience tailored to different player preferences.
        </p>
        <ul>
          <li>
            <strong>Standard Bingo:</strong> 
            <ul>
              <li>Win by marking five squares in a row horizontally, vertically, or diagonally.</li>
              <li>Requires strategic placement and timely marking of numbers.</li>
            </ul>
          </li>
          <li>
            <strong>Blackout Bingo:</strong>
            <ul>
              <li>Win by marking all squares on your Bingo card.</li>
              <li>Offers a more challenging and rewarding experience for avid Bingo enthusiasts.</li>
            </ul>
          </li>
        </ul>
      </section>
      
      {/* ICP Explanation Section */}
      <section className="icp-explanation">
        <h2>What is ICP?</h2>
        <p>
          The <strong>Internet Computer Protocol (ICP)</strong> is a revolutionary blockchain technology that enables the creation of decentralized applications (dApps) with enhanced scalability, speed, and security. By leveraging ICP, <strong>Blockchain Bingo</strong> operates seamlessly on-chain, ensuring transparent game mechanics, secure transactions, and a trustless environment where players can enjoy Bingo without intermediaries.
        </p>
      </section>
      
      {/* User Guides Section */}
      <section className="user-guides">
        <h2>User Guides</h2>
        <ul>
          <li>
            <strong>Creating or Changing Your Username:</strong>
            <p>
              Navigate to the <em>Chat Room</em> within any game and click on the <strong>Create Username</strong> or <strong>Change Username</strong> button. Follow the prompts to set or update your display name, enhancing your interaction within the community.
            </p>
          </li>
          <li>
            <strong>Hosting a Game:</strong>
            <p>
              Hosting your own Bingo game is simple and rewarding. Follow these steps to set up a game that attracts players and offers enticing rewards:
            </p>
            <ul>
              <li>
                <strong>Choose a Game Name:</strong> Select a unique and catchy name that reflects the theme or atmosphere of your game.
              </li>
              <li>
                <strong>Set the Entry Price:</strong> Determine the price for each Bingo card. Remember, when you set the price in the Host Bingo screen, an additional <strong>0.0002 ICP</strong> is added to cover network fees required for user registration.
              </li>
              <li>
                <strong>Define the Host Percentage:</strong> Decide on the percentage of the total pot you wish to retain as the host. This percentage is taken after a <strong>2.5% service fee</strong> is deducted from the total card price. For example, if you set a host percentage of <strong>10%</strong> on a card price of <strong>1 ICP</strong>, the service fee would be <strong>0.025 ICP</strong>, leaving <strong>0.975 ICP</strong>. Your host percentage would then be <strong>0.0975 ICP</strong>, and the remaining <strong>0.8775 ICP</strong> would be allocated as the prize pool for the winner.
                <br/><br/>
                Now, with the latest update, hosts can set their percentage up to <strong>100%</strong> of the net amount after the service fee. For example:
                <ul>
                  <li>
                    <strong>Card Price:</strong> 1 ICP
                  </li>
                  <li>
                    <strong>Service Fee (2.5%):</strong> 0.025 ICP
                  </li>
                  <li>
                    <strong>Amount After Service Fee:</strong> 0.975 ICP
                  </li>
                  <li>
                    <strong>Host Percentage (100%):</strong> 0.975 ICP
                  </li>
                  <li>
                    <strong>Prize Pool Allocation:</strong> 0 ICP
                  </li>
                </ul>
                <p>
                  By setting the host percentage to 100%, you retain the entire net amount after the service fee. Adjust the host percentage according to your preference to balance between personal earnings and prize pool allocation.
                </p>
              </li>
              <li>
                <strong>Create Private Games:</strong> Enhance exclusivity by adding a password to your game. Players will need to enter this password before registering, ensuring only authorized participants can join.
              </li>
            </ul>
            <p>
              By hosting a game, you not only create an engaging experience for players but also earn a share of the prize pool, making it a rewarding endeavor.
            </p>
          </li>
        </ul>
      </section>
      
      {/* Financial Breakdown Section */}
      <section className="financial-breakdown">
        <h2>Financial Breakdown</h2>
        <p>
          Understanding how funds are managed within <strong>Blockchain Bingo</strong> ensures transparency and trust. Here's a detailed breakdown of the financial aspects:
        </p>
        <ul>
          <li>
            <strong>Additional ICP Fees:</strong>
            <p>
              When setting the entry price for Bingo cards in the Host Bingo screen, an additional <strong>0.0002 ICP</strong> is added to the card price. This covers two separate transactions, each requiring a <strong>0.0001 ICP</strong> network fee, necessary for the registration process.
            </p>
          </li>
          <li>
            <strong>Service Fee:</strong>
            <p>
              A <strong>2.5%</strong> service fee is deducted from the total card price each time a user registers for a game. This fee supports the maintenance and development of the platform.
            </p>
          </li>
          <li>
            <strong>Host Percentage:</strong>
            <p>
              After the service fee is deducted, the host percentage is taken from the remaining amount. For example:
            </p>
            <ul>
              <li>
                <strong>Card Price:</strong> 1 ICP
              </li>
              <li>
                <strong>Service Fee (2.5%):</strong> 0.025 ICP
              </li>
              <li>
                <strong>Amount After Service Fee:</strong> 0.975 ICP
              </li>
              <li>
                <strong>Host Percentage (10%):</strong> 0.0975 ICP
              </li>
              <li>
                <strong>Prize Pool Allocation:</strong> 0.8775 ICP
              </li>
            </ul>
            <p>
              With the latest update, hosts can now set their percentage up to <strong>100%</strong>, allowing them to retain the entire net amount after the service fee. For example:
            </p>
            <ul>
              <li>
                <strong>Card Price:</strong> 1 ICP
              </li>
              <li>
                <strong>Service Fee (2.5%):</strong> 0.025 ICP
              </li>
              <li>
                <strong>Amount After Service Fee:</strong> 0.975 ICP
              </li>
              <li>
                <strong>Host Percentage (100%):</strong> 0.975 ICP
              </li>
              <li>
                <strong>Prize Pool Allocation:</strong> 0 ICP
              </li>
            </ul>
            <p>
              The remaining amount after both deductions forms the prize pool, which is awarded to the winner of the game. Hosts now have greater flexibility in determining their earnings from each game.
            </p>
          </li>
          <li>
            <strong>Prize Pool Allocation:</strong>
            <p>
              The accumulated prize pool is distributed to the winner(s) of the game. Additionally, hosts receive their designated percentage once the winner claims their winnings. This ensures that both hosts and winners are rewarded promptly.
            </p>
          </li>
          <li>
            <strong>Claiming Winnings:</strong>
            <p>
              When a user presses the <strong>Claim Winnings</strong> button, two transactions are executed:
            </p>
            <ul>
              <li>
                A transaction directing the prize to the winner's ICP account.
              </li>
              <li>
                A transaction directing the host's percentage to their ICP account.
              </li>
            </ul>
            <p>
              This dual-transaction system ensures fair and immediate distribution of rewards.
            </p>
          </li>
        </ul>
      </section>
      
      {/* Installation Guide Section */}
      <section className="installation-guide">
        <h2>Get Started with Blockchain Bingo</h2>
        <p>
          <strong>Blockchain Bingo</strong> is designed to be accessible on any device. Enhance your gaming experience by installing the app directly to your device:
        </p>
        <ul>
          <li>
            <strong>For Mobile Devices:</strong> Click the <em>Install</em> button in your browser to add Blockchain Bingo to your home screen, allowing quick and easy access.
          </li>
          <li>
            <strong>For Desktop Users:</strong> Add Blockchain Bingo as a web app by following your browser's installation prompts, enabling a native-like experience.
          </li>
        </ul>
        <p>
          Enjoy seamless gameplay anytime, anywhere!
        </p>
      </section>
      
      {/* Terms and Conditions Section */}
      <section className="terms-and-conditions">
        <h2>Terms and Conditions</h2>
        <p>
          <strong>Effective Date:</strong> December 4th, 2024
        </p>
        <p>
          Welcome to <strong>Blockchain Bingo</strong>. By accessing or using our platform, you agree to be bound by these Terms and Conditions. Please read them carefully.
        </p>
        <h3>1. Acceptance of Terms</h3>
        <p>
          By using Blockchain Bingo, you agree to comply with and be legally bound by these Terms and Conditions, as well as our Privacy Policy.
        </p>
        <h3>2. Geoblocking and Location-Based Restrictions</h3>
        <p>
          Blockchain Bingo utilizes geoblocking to restrict access in areas where bingo games may be prohibited or restricted by law. By using the app, you consent to the collection of your location data through your IP address to enforce these restrictions.
        </p>
        <p>
          <strong>Currently Blocked Locations:</strong>
        </p>
        <ul>
          <li><strong>Prohibited Countries:</strong> Bangladesh, Israel, Poland, Russia, Singapore, United Arab Emirates, Indonesia.</li>
          <li><strong>Prohibited US States:</strong> Illinois, Indiana, Louisiana, Michigan, Nevada, New York, Oregon, South Dakota, Washington, Wisconsin.</li>
        </ul>
        <p>
          If your country or state is not listed above but bingo is not permitted in your region, please report it using the in-game <strong>Contact</strong> button so we can update our geoblocking configurations.
        </p>
        <h3>3. Eligibility</h3>
        <p>
          You must be at least 18 years old to use Blockchain Bingo. By accessing the platform, you represent and warrant that you meet this age requirement.
        </p>
        <h3>4. Use of the Platform</h3>
        <p>
          You agree to use Blockchain Bingo only for lawful purposes and in a manner that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the platform.
        </p>
        <h3>5. Payments and Fees</h3>
        <p>
          All transactions on Blockchain Bingo are final. Be aware of the additional ICP fees associated with game registrations and transactions as outlined in our Financial Breakdown section.
        </p>
      </section>
      
      <button onClick={() => window.history.back()} className="back-button">
        Back to Menu
      </button>
    </div>
  );
}

export default About;
