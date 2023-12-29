import { IWallet } from "../interface/WalletInterface"
import { Walli } from "../typechain-types"


export type WalliType = {
    goerli: string,
    mumbai: string,
    set: boolean
}

export type WalliPropType = {
    wallet: IWallet,
    walli: WalliType
}

export type ListsType = {
    [k: string]: Walli.ProfileStruct[]
}

export type ListDataCardPropType = {
    profiles: Walli.ProfileStruct[] | Walli.RequestConfigStruct[],
    remove: (address: string, name: string) => void,
    cancel: (address: string) => void,
    confirm: (address: string) => void,
    pending: boolean,
    title: string,
}

export type ListDataType = {
    recoveryAddress: string,
    newOwner: string,
    setRecoveryAddress: (e:any) => void,
    setNewOwner: (e:any) => void,
    initiateRecovery: () => void,
    confirmRecovery: () => void,
    cancelRecovery: () => void,
    finaliseRecovery: () => void,
    requestType: string,
}

export type ContainerPropType = {
    wallet: IWallet,
    walli: WalliType,
    setLock: (e:any)=>void,
}