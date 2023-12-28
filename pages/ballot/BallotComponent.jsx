import { useState, useEffect } from "react";
import { ethers } from "ethers";
import proofsData from "./proofs/proofs.json";

const BallotComponent = ({ provider, ballotAddress, ballotABI }) => {
  const [ballotContract, setBallotContract] = useState(null);
  const [yesVotes, setYesVotes] = useState(0);
  const [noVotes, setNoVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [vote, setVote] = useState(null); // null initially
  const [ballotText, setBallotText] = useState("");
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    if (provider && ballotAddress) {
      const contract = new ethers.Contract(
        ballotAddress,
        ballotABI,
        provider.getSigner()
      );
      setBallotContract(contract);
      loadBallotData();
    }
  }, [provider, ballotAddress, ballotABI]);


  useEffect(() => {
    // Load ballot data when the contract is set
    if (ballotContract) {
      loadBallotData();
    }
  }, [ballotContract]);

  const loadBallotData = async () => {
    if (ballotContract) {
      const yes = await ballotContract.yesVotes();
      const no = await ballotContract.noVotes();
      const text = await ballotContract.ballotText();
      setYesVotes(yes);
      setNoVotes(no);
      setBallotText(text);
      checkUserVotingStatus();
    }
  };

  const loadVotes = async () => {
    if (ballotContract) {
      const yes = await ballotContract.yesVotes();
      const no = await ballotContract.noVotes();
      setYesVotes(yes);
      setNoVotes(no);
    }
  };

  const checkUserVotingStatus = async () => {
    if (provider && ballotContract) {
      const accounts = await provider.listAccounts();
      setUserAddress(accounts[0].toLowerCase());
      const voted = await ballotContract.hasVoted(accounts[0]);
      setHasVoted(voted);
    }
  };

  const handleVote = async (voteChoice) => {
    if (ballotContract && voteChoice != null) {
      try {
        const accounts = await provider.listAccounts();
        const userAddress = accounts[0].toLowerCase(); // Get user's address

        const userProofData = proofsData.proofs.find(
          (p) => p.address.toLowerCase() === userAddress
        );

        if (!userProofData) {
          console.error("No proof found for this address");
          return;
        }

        const proof = userProofData.proof.map(ethers.utils.hexlify);
        const tx = await ballotContract.vote(voteChoice, proof, {
          gasLimit: 5000000,
        });
        await tx.wait();
        setHasVoted(true);
        loadVotes();
      } catch (error) {
        console.error("Error in voting:", error);
      }
    }
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg max-w-sm">
         <h3 className="text-lg font-semibold mb-2">Ballot Text: {ballotText}</h3>
      <h3 className="text-sm font-italic mb-2">Ballot address: {ballotAddress}</h3>
      <p className="text-sm mb-1">Yes Votes: {yesVotes.toString()}</p>
      <p className="text-sm mb-4">No Votes: {noVotes.toString()}</p>
      <p className="text-sm mb-4">Your Vote: {hasVoted ? "Already Voted" : "Not Voted"}</p>
      <div className="flex gap-4">
        <button
          onClick={() => handleVote(true)}
          disabled={hasVoted}
          className={`py-2 px-4 rounded text-white font-medium ${
            !hasVoted ? "bg-green-500 hover:bg-green-600" : "bg-gray-400"
          }`}
        >
          Vote Yes
        </button>
        <button
          onClick={() => handleVote(false)}
          disabled={hasVoted}
          className={`py-2 px-4 rounded text-white font-medium ${
            !hasVoted ? "bg-red-500 hover:bg-red-600" : "bg-gray-400"
          }`}
        >
          Vote No
        </button>
      </div>
    </div>
  );
};

export default BallotComponent;
