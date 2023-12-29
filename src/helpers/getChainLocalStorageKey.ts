import { ethers } from "ethers";
import { IWallet } from "../interface/WalletInterface";

export function getChainLocalStorageKey(wallet: IWallet){
    const chainKey = wallet.chainId == 5n ? "goerli" : "mumbai";
    return "walli:" + (wallet.address).toLowerCase() + ":" + chainKey + ":";
}