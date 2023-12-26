import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { Fr } from '@aztec/bb.js'; // Assuming Fr is used for leaf values
import { MerkleTree } from './NoirMerkleTree'; // Import your custom MerkleTree class

const MerkleTreeComponent = () => {
  const [addresses, setAddresses] = useState([]);
  const [merkleData, setMerkleData] = useState({ root: '', proofs: [] });

  const handleInputChange = (e) => {
    const inputAddresses = e.target.value.split('\n').filter(addr => addr.trim());
    setAddresses(inputAddresses);
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target.result;
        const fileAddresses = fileContent.split('\n').filter(addr => addr.trim());
        setAddresses(fileAddresses);
      };
      reader.readAsText(file);
    }
  };

  const generateMerkleTree = async () => {
    const numLeaves = addresses.length;
    const levels = Math.ceil(Math.log2(numLeaves === 0 ? 1 : numLeaves));
    const tree = new MerkleTree(levels);
    await tree.initialize([]); // Initialize with no default leaves

    addresses.forEach(addr => {
      tree.insert(Fr.fromString(addr)); // Convert address to Fr and insert
    });

    const proofs = addresses.map((addr, index) => {
      const proof = tree.proof(index);
      return {
        address: addr,
        index,
        proof: JSON.stringify(proof) // Format the proof as needed
      };
    });

    setMerkleData({ root: tree.root().toString(), proofs });
  };

  const downloadResults = () => {
    const blob = new Blob([JSON.stringify(merkleData, null, 2)], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'merkle-tree-data.txt');
  };

  return (
    <div className="container mx-auto p-4">
      <textarea 
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="Enter addresses separated by new lines" 
        onChange={handleInputChange}
      ></textarea>
      <input 
        type="file" 
        accept=".txt" 
        className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        onChange={handleFileInput} 
      />
      <button 
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        onClick={generateMerkleTree}
      >
        Generate Merkle Tree
      </button>
      <button 
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        onClick={downloadResults}
      >
        Download Results
      </button>
      <div className="mt-4">
        <strong className="text-xl">Merkle Root:</strong> <span className="text-gray-700">{merkleData.root}</span>
        <ul className="list-disc pl-5 mt-2">
          {merkleData.proofs.map((item, index) => (
            <li key={index} className="mt-1">
              <strong>Address:</strong> {item.address}
              <br />
              <strong>Proof:</strong> <span className="text-gray-600">{item.proof}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MerkleTreeComponent;
