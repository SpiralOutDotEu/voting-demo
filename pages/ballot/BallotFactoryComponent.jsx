import { useState, useEffect } from "react";
import { ethers } from "ethers";
import BallotFactoryABI from "./ABI/BallotFactory.json";
import BallotABI from "./ABI/Ballot.json";
import BallotComponent from "./BallotComponent";

const BallotFactoryComponent = () => {
  const [provider, setProvider] = useState(null);
  const [userAddress, setUserAddress] = useState("");
  const [signer, setSigner] = useState(null);
  const [factoryContract, setFactoryContract] = useState(null);
  const [ballots, setBallots] = useState([]);
  const [merkleRoot, setMerkleRoot] = useState("");
  const [ballotText, setBallotText] = useState("");

  const factoryAddress = "0xAdEB4A647E8765f211228fdb68D836252D0d858c";
  const factoryABI = BallotFactoryABI.abi;
  const ballotABI = BallotABI.abi;

  useEffect(() => {
    if (window?.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  useEffect(() => {
    // Load ballots when factoryContract is set
    if (factoryContract) {
      loadBallots();
    }
  }, [factoryContract]);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const newProvider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(newProvider);
        await newProvider.send("eth_requestAccounts", []);
        const signer = newProvider.getSigner();
        const address = await signer.getAddress();
        setUserAddress(address);

        // Initialize factory contract and load ballots
        const contract = new ethers.Contract(factoryAddress, factoryABI, signer);
        setFactoryContract(contract);
        await loadBallots();

      } catch (error) {
        console.error("Error connecting to wallet:", error);
      }
    } else {
      console.log("Please install MetaMask");
    }
  };

  const deployBallot = async () => {
    if (factoryContract) {
      const tx = await factoryContract.createBallot(merkleRoot, ballotText);
      await tx.wait();
      await loadBallots();
    }
  };

  const loadBallots = async () => {
    if (factoryContract) {
      const count = await factoryContract.getNumberOfBallots();
      const ballotsArray = [];
      for (let i = 0; i < count; i++) {
        const ballotAddress = await factoryContract.getBallot(i);
        // Add more data as needed, e.g., votes, etc.
        ballotsArray.push(ballotAddress);
      }
      setBallots(ballotsArray);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <button 
        onClick={connectWallet} 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
         {userAddress ? `${userAddress.substring(0, 6)}...` : "Connect Wallet"}
      </button>
  
      <div className="my-4">
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={merkleRoot}
          onChange={(e) => setMerkleRoot(e.target.value)}
          placeholder="Merkle Root"
        />
      </div>
  
      <div className="mb-4">
        <input
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={ballotText}
          onChange={(e) => setBallotText(e.target.value)}
          placeholder="Ballot Text"
        />
      </div>
  
      <button 
        onClick={deployBallot} 
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Deploy Ballot
      </button>
  
      {/* <div className="mt-4 space-y-2">
        {ballots.map((address, index) => (
          <div key={index} className="p-2 bg-gray-200 rounded">{address}</div>
        ))}
      </div> */}
  
      <div className="mt-4 space-y-2">
        {ballots.map((address, index) => (
          <BallotComponent
            key={index}
            provider={provider}
            ballotAddress={address}
            ballotABI={ballotABI}
          />
        ))}
      </div>
    </div>
  );
  
};

export default BallotFactoryComponent;
