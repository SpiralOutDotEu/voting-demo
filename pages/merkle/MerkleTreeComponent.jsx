import  { useState } from 'react';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { saveAs } from 'file-saver';

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

  const generateMerkleTree = () => {
    const tree = StandardMerkleTree.of(addresses.map(addr => [addr]), ['address']);
    const root = tree.root;
    const proofs = addresses.map(addr => ({ 
      address: addr, 
      proof: tree.getProof([addr]).map(p => p.toString('hex')) 
    }));

    setMerkleData({ root, proofs });
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
              <strong>Proof:</strong> <span className="text-gray-600">{item.proof.join(', ')}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default MerkleTreeComponent;