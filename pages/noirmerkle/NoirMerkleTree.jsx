import { newBarretenbergApiSync } from '@aztec/bb.js';
import { Fr } from '@aztec/bb.js';

export class MerkleTree {
  constructor(levels) {
    this.zeroValue = Fr.fromString(
      '18d85f3de6dcd78b6ffbf5d8374433a5528d8e3bf2100df0b7bb43a4c59ebd63',
    );
    this.levels = levels;
    this.storage = new Map();
    this.zeros = [];
    this.totalLeaves = 0;
    this.bb = null;
  }

  async initialize(defaultLeaves) {
    this.bb = await newBarretenbergApiSync();

    let currentZero = this.zeroValue;
    this.zeros.push(currentZero);

    for (let i = 0; i < this.levels; i++) {
      currentZero = this.pedersenHash(currentZero, currentZero);
      this.zeros.push(currentZero);
    }

    for (const leaf of defaultLeaves) {
      this.insert(leaf);
    }
  }

  pedersenHash(left, right) {
    let hashRes = this.bb.pedersenHashPair(left, right);
    return hashRes;
  }

  static indexToKey(level, index) {
    return `${level}-${index}`;
  }

  getIndex(leaf) {
    for (const [key, value] of this.storage) {
      if (value.toString() === leaf.toString()) {
        return Number(key.split('-')[1]);
      }
    }
    return -1;
  }

  root() {
    return this.storage.get(MerkleTree.indexToKey(this.levels, 0)) || this.zeros[this.levels];
  }

  proof(indexOfLeaf) {
    let pathElements = [];
    let pathIndices = [];

    const leaf = this.storage.get(MerkleTree.indexToKey(0, indexOfLeaf));
    if (!leaf) throw new Error('Leaf not found');

    const handleIndex = (level, currentIndex, siblingIndex) => {
      const siblingValue =
        this.storage.get(MerkleTree.indexToKey(level, siblingIndex)) || this.zeros[level];
      pathElements.push(siblingValue);
      pathIndices.push(currentIndex % 2);
    };

    this.traverse(indexOfLeaf, handleIndex);

    return {
      root: this.root(),
      pathElements,
      pathIndices,
      leaf: leaf,
    };
  }

  insert(leaf) {
    const index = this.totalLeaves;
    this.update(index, leaf, true);
    this.totalLeaves++;
  }

  update(index, newLeaf, isInsert = false) {
    if (!isInsert && index >= this.totalLeaves) {
      throw new Error('Use insert method for new elements.');
    } else if (isInsert && index < this.totalLeaves) {
      throw new Error('Use update method for existing elements.');
    }

    let keyValueToStore = [];
    let currentElement = newLeaf;

    const handleIndex = (level, currentIndex, siblingIndex) => {
      const siblingElement =
        this.storage.get(MerkleTree.indexToKey(level, siblingIndex)) || this.zeros[level];

      let left, right;
      if (currentIndex % 2 === 0) {
        left = currentElement;
        right = siblingElement;
      } else {
        left = siblingElement;
        right = currentElement;
      }

      keyValueToStore.push({
        key: MerkleTree.indexToKey(level, currentIndex),
        value: currentElement,
      });
      currentElement = this.pedersenHash(left, right);
    };

    this.traverse(index, handleIndex);

    keyValueToStore.push({
      key: MerkleTree.indexToKey(this.levels, 0),
      value: currentElement,
    });

    keyValueToStore.forEach(o => {
      this.storage.set(o.key, o.value);
    });
  }

  traverse(indexOfLeaf, handler) {
    let currentIndex = indexOfLeaf;
    for (let i = 0; i < this.levels; i++) {
      let siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      handler(i, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }
}
