/**
 * Copyright (c) Hathor Labs and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import hathorLib from '@hathor/wallet-lib';

class LocalStorageStore {
  getItem(key) {
    let item;
    try {
      item = localStorage.getItem(key);
      return JSON.parse(item);
    } catch (e) {
      // old versions of the wallet would save strings without converting
      // to JSON, so we catch this exception here and return the string directly
      // FIXME this is a temporary solution and should be fixed by versioning
      // the storage: https://github.com/HathorNetwork/hathor-wallet-lib/issues/19
      if (e instanceof SyntaxError) {
        // first save in JSON format
        this.setItem(key, item);
        // return it
        return item;
      }
      throw e;
    }
  }

  setItem(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  removeItem(key) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }
}

/*
 * We use this storage so 'wallet:data' is kept in memory. This information may become very large if
 * there are thousands of txs on the wallet history (we got this error with 15k txs) and the localStorage
 * does not store data after a certain limit (it fails silently).
 *
 * In theory, there shouldn't be a limit for localStorage with Electron, as it's been patched here: https://github.com/electron/electron/pull/15596.
 * However, this other comment (https://github.com/electron/electron/issues/13465#issuecomment-494983533) suggests
 * there was still a problem.
 *
 * It's not a problem if 'wallet:data' is not persisted, as this data is always loaded when we connect to the server.
 */
class HybridStore {
  static nonPrefixedKeyList = ['list-of-wallets'];

  constructor() {
    this.memStore = new hathorLib.MemoryStore();
    this.persistentStore = new LocalStorageStore();
    this.prefix = '';
    this.nonPrefixedKeys = new Set(HybridStore.nonPrefixedKeyList);
  }

  getListOfWallets() {
    return this.getItem('list-of-wallets') || {'': { name: 'Default' }};
  }

  getWalletName() {
    const listOfWallets = this.getListOfWallets();
    return listOfWallets[this.prefix].name;
  }

  removeWallet(prefix) {
    const listOfWallets = this.getListOfWallets();
    if (listOfWallets[prefix] !== undefined) {
      delete listOfWallets[prefix];
      this.setItem('list-of-wallets', listOfWallets);
    } else {
      // The wallet being deleted does not exist
      throw new Error('Wallet does not exist.');
    }
  }

  addWallet(name, prefix) {
    const listOfWallets = this.getListOfWallets();
    if (listOfWallets[prefix] !== undefined) {
      throw new Error("This wallet prefix is already in use.");
    }
    listOfWallets[prefix] = {name};
    this.setItem('list-of-wallets', listOfWallets);
  }

  _getStore(key) {
    if (key === 'wallet:data') {
      return this.memStore;
    }
    return this.persistentStore;
  }

  _getKey(prefix, key) {
    if (this.nonPrefixedKeys.has(key)) {
      return key;
    }
    if (prefix && prefix.length > 0) {
      return prefix + "$" + key;
    }
    return key;
  }

  getPrefixedItem(prefix, key) {
    return this._getStore(key).getItem(this._getKey(prefix, key));
  }

  setPrefixedItem(prefix, key, value) {
    return this._getStore(key).setItem(this._getKey(prefix, key), value);
  }

  removePrefixedItem(prefix, key) {
    return this._getStore(key).removeItem(this._getKey(prefix, key));
  }

  getItem(key) {
    return this.getPrefixedItem(this.prefix, key);
  }

  setItem(key, value) {
    return this.setPrefixedItem(this.prefix, key, value);
  }

  removeItem(key) {
    return this.removePrefixedItem(this.prefix, key);
  }

  clear() {
    // XXX Should we clear all keys or only the the prefixed ones?
    this.memStore.clear();
    this.persistentStore.clear();
  }
}

export { LocalStorageStore, HybridStore };
