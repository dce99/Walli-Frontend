import { ethers, BrowserProvider, Network } from "ethers";
import { useState, useEffect, useRef } from "react";
import { IWallet } from "../../interface/WalletInterface";
import { WalliFactory__factory, Walli__factory } from "../../typechain-types";
import Container from "./Container";
import { Button, Stack, chakra, useToast } from "@chakra-ui/react";
import SpinnerDisplay from "../../components/Spinner";
import { NUMBER_OF_BLOCKS_WAIT } from "../../helpers/const";
import { getChainLocalStorageKey } from "../../helpers/getChainLocalStorageKey";
import CustomWalli from "../../components/customWalliAddress";
import { loadingToast, successToast, errorToast } from "../../helpers/toasts";

// wallet is the signer
// walli is the AA smart account wallet
function Walli() {
    const initialWallet: IWallet = { address: "", chainId: 0n };
    const [wallet, setWallet] = useState(initialWallet);

    const [isConnecting, setIsConnecting] = useState(false)
    const [walli, setWalli] = useState({ goerli: "", mumbai: "", set: false });
    const [loading, setLoading] = useState<boolean>(false);
    const [closeCustomWalli, setCloseCustomWalli] = useState<boolean>(true);
    const toast = useToast();
    const toastRef = useRef();

    const WALLI_FACTORY_ADDRESS_GOERLI = ``;
    const WALLI_FACTORY_ADDRESS_MUMBAI = `${process.env.REACT_APP_WALLI_FACTORY_ADDRESS_MUMBAI}`;

    useEffect(() => {
        const getProvider = async () => {
            let provider: any;
            if (window.ethereum) {
                provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send('eth_accounts');
                updateWallet(accounts);
                window.ethereum.on('accountsChanged', updateWallet);
                window.ethereum.on('chainChanged', updateChain);
            }
            else
                loadingClose("error", "Please install a wallet");
        }

        getProvider();
        return () => {
            window.ethereum?.removeListener('accountsChanged', updateWallet);
            window.ethereum?.removeListener("chainChanged", updateChain);
        }

    }, []);

    useEffect(() => {

        const init = async () => {
            if (wallet.address) {
                const chainKey = wallet.chainId == 5n ? "goerli" : "mumbai";
                const nonChainKey = wallet.chainId == 5n ? "mumbai" : "goerli";
                const walliProxy = localStorage.getItem(getChainLocalStorageKey(wallet) + "proxy");
                console.log(getChainLocalStorageKey(wallet) + "proxy", walliProxy);
                if (walliProxy) {
                    const provider = new ethers.BrowserProvider(window.ethereum);
                    const signer = await provider.getSigner(wallet.address);
                    const res = await signer.call({
                        to: walliProxy,
                        data: Walli__factory.createInterface().encodeFunctionData("owner")
                    });
                    const owner = Walli__factory.createInterface().decodeFunctionResult("owner", res)[0];
                    if (owner != signer.address) {
                        localStorage.removeItem(getChainLocalStorageKey(wallet) + "proxy");
                        localStorage.removeItem(getChainLocalStorageKey(wallet) + "deviceId");
                        localStorage.removeItem(getChainLocalStorageKey(wallet) + "email");
                        localStorage.removeItem(getChainLocalStorageKey(wallet) + "key");
                        setWalli({ set: false, goerli: "", mumbai: "" });
                    }
                    else {
                        setWalli({ ...walli, set: true, [chainKey]: walliProxy, [nonChainKey]: "" });
                    }
                }
                else {
                    toast({
                        title: 'Walli Account not found',
                        description: "Walli Account for given signer and chain not found. Either Create/Deploy a new one or enter a Walli account address (in given field) whoses ownership has been transferred to you by someone else.",
                        position: "top",
                        status: 'info',
                        duration: 15000,
                        isClosable: true,
                    })
                    setWalli({ set: false, goerli: "", mumbai: "" });
                }
            }
        }
        init();

    }, [wallet.chainId, wallet.address])



    const loadingInit = () => {
        // @ts-ignore
        toastRef.current = toast(loadingToast("Sending transaction, please wait."));
    }
    const loadingClose = (status: "error" | "success", description?: string) => {
        if (toastRef.current) {
            toast.close(toastRef.current);
            toastRef.current = undefined;
            if (description && status == "success")
                // @ts-ignore
                toast(successToast(description))
            else if (description)
                // @ts-ignore
                toast(errorToast(description));
        }
        else {
            if (description && status == "success")
                // @ts-ignore
                toast(successToast(description))
            else if (description)
                // @ts-ignore
                toast(errorToast(description));
        }
    }

    const updateWallet = async (accounts: any[]) => {
        if (accounts.length === 0)
            setWallet(initialWallet);
        else {
            const provider = await new BrowserProvider(window.ethereum);
            const chainId = (await provider.getNetwork())?.chainId;
            setWallet({ chainId, address: accounts[0] });
        }
    }

    const updateChain = (chainId: any) => {
        window.location.reload();
        // setWallet({ ...wallet, chainId });
    }

    const handleError = (error: any) => {
        const revertData = error?.data;
        try { const decodedError = WalliFactory__factory.createInterface().parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose("error", "JsonRpc Error: Please check input fields and try again ") }
    }

    const getSmartWallet = async () => {
        // deploy or get wallet on two chains(Goerli and Polygon Mumbai)
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const owner = await provider.getSigner(wallet.address);
            const chainKey = wallet.chainId == 5n ? "goerli" : "mumbai";
            setLoading(true);
            if (chainKey == "goerli") {
                const walliFactoryGoerli = WalliFactory__factory.connect(WALLI_FACTORY_ADDRESS_GOERLI, owner);
                const tx1 = await walliFactoryGoerli.createAccount(owner, 0);
                await tx1.wait(NUMBER_OF_BLOCKS_WAIT);
                const walliProxyAddressGoerli = await walliFactoryGoerli.getComputeAddress(owner, 0);
                localStorage.setItem(getChainLocalStorageKey(wallet) + "proxy", walliProxyAddressGoerli);
                setLoading(false);
                setWalli({ ...walli, goerli: walliProxyAddressGoerli, set: true });
            }
            else {
                const walliFactoryMumbai = WalliFactory__factory.connect(WALLI_FACTORY_ADDRESS_MUMBAI, owner);
                const tx2 = await walliFactoryMumbai.createAccount(owner, 0);
                await tx2.wait(NUMBER_OF_BLOCKS_WAIT);
                const walliProxyAddressMumbai = await walliFactoryMumbai.getComputeAddress(owner, 0);
                localStorage.setItem(getChainLocalStorageKey(wallet) + "proxy", walliProxyAddressMumbai);
                setLoading(false);
                setWalli({ ...walli, mumbai: walliProxyAddressMumbai, set: true });
            }
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const connectWalletHandler = async () => {
        setIsConnecting(true);

        if (window.ethereum) {
            try {
                setIsConnecting(true);
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                updateWallet([signer.address]);
                window.ethereum.on('accountsChanged', updateWallet);
                window.ethereum.on('chainChanged', updateChain);
            }
            catch (error: any) {
                handleError(error);
            }
        }
        else
            loadingClose("error", "Please install a wallet");


        setIsConnecting(false);
    }

    const disableConnect = !(Boolean(wallet)) && isConnecting;

    return (
        <div>
            {
                window.ethereum?.isMetaMask && !wallet.address &&
                <chakra.button
                    px='2.5'
                    py='1.5'
                    bg='blue.300'
                    rounded='md'
                    _hover={{ bg: 'blue.500' }}
                    fontWeight={10}
                    position={"relative"}
                    top={"300"}
                    left={"45%"}
                    right={"50%"}
                    disabled={disableConnect}
                    onClick={connectWalletHandler}
                >
                    Connect MetaMask
                </chakra.button>
            }
            {
                window.ethereum?.isMetaMask && wallet.address && !walli.set &&
                <>
                    <Stack margin={"200"} width={"30%"} marginLeft={"35%"} border={"2px"} rounded='md'
                    >
                        <Button
                            colorScheme="blue"
                            margin={"7"}
                            disabled={disableConnect}
                            onClick={getSmartWallet}
                        >
                            Deploy Walli Smart Account
                        </Button>
                        <Button
                            colorScheme="blue"
                            margin={"7"}
                            disabled={disableConnect}
                            onClick={() => setCloseCustomWalli(false)}
                        >
                            Import Custom Walli Account
                        </Button>
                        {
                            !closeCustomWalli &&
                            <CustomWalli wallet={wallet} setWalli={setWalli} setCloseCustomWalli={setCloseCustomWalli} />
                        }
                    </Stack>
                </>
            }
            {
                loading &&
                <SpinnerDisplay />
            }
            {
                wallet.address && walli.set &&
                <Container wallet={wallet} walli={walli} setWalli={setWalli} />
            }


        </div>
    );
}


export default Walli;