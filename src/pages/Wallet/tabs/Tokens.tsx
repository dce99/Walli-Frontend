import { Stack, InputGroup, InputLeftAddon, Input, Box, Card, Button, useToast } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { WalliPropType } from "../../../types/prop-types";
import { ethers } from "ethers";
import { ERC20__factory, Walli__factory } from "../../../typechain-types";
import { NUMBER_OF_BLOCKS_WAIT } from "../../../helpers/const";
import { loadingToast, successToast, errorToast } from "../../../helpers/toasts";

// wallet is the signer
// walli is the AA smart account wallet
function Tokens({ wallet, walli }: WalliPropType) {

    const [depositTokenAddress, setDepositTokenAddress] = useState<string>("");
    const [balanceTokenAddress, setBalanceTokenAddress] = useState<string>("");
    const [deposit, setDeposit] = useState<string>("0");
    const [tokenBalance, setTokenBalance] = useState<string>("0");
    const [nativeBalance, setNativeBalance] = useState<string>("0");
    const [tabIndex, setTabIndex] = useState<number>(0);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;

    const toast = useToast();
    const toastRef = useRef();
    const loadingInit = () => {
        // @ts-ignore
        toastRef.current = toast(loadingToast("Sending transaction, please wait."));
    }
    const loadingClose = (status: "error" | "success", description?: string)=>{
        if (toastRef.current) {
            toast.close(toastRef.current);
            toastRef.current = undefined;
            if (description && status == "success")
                // @ts-ignore
                toast(successToast(description))
            else if(description)
                // @ts-ignore
                toast(errorToast(description));
        }
        else{
            if (description && status == "success")
                // @ts-ignore
                toast(successToast(description))
            else if (description)
                // @ts-ignore
                toast(errorToast(description));
        }
    }

    const handleDepositToken = async () => {
        const owner = await provider.getSigner(wallet.address);
        const token = ERC20__factory.connect(depositTokenAddress, owner);
        try {
            loadingInit();
            const res = await token.transfer(walliAddress, ethers.parseEther(deposit));
            await res.wait(NUMBER_OF_BLOCKS_WAIT);
            loadingClose("success", "Token deposited into Walli");
        }
        catch (error: any) {
            const revertData = error?.data; 
            try { const decodedError = token.interface.parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose( "error" ,"JsonRpc Error: Please check input fields and try again ") }
        }
    }

    const handleDepositNative = async () => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const res = await owner.sendTransaction({
                to: walliAddress,
                data: "0x",
                value: ethers.parseEther(deposit)
            });
            await res.wait(NUMBER_OF_BLOCKS_WAIT);
            loadingClose("success", "Native Token deposited into Walli");
        }
        catch (error: any) {
            const revertData = error?.data;
            try { const decodedError = Walli__factory.createInterface().parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose("error", "JsonRpc Error: Please check input fields and try again ") }
        }
    }

    const handleGetTokenBalance = async () => {
        const owner = await provider.getSigner(wallet.address);
        const token = ERC20__factory.connect(balanceTokenAddress, owner);
        try {
            loadingInit();
            const bal = await token.balanceOf(walliAddress);
            setTokenBalance(ethers.formatEther(bal.toString()));
            loadingClose("success", "Balance retrieved");
        }
        catch (error: any) {
            const revertData = error?.data;
            try { const decodedError = token.interface.parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose("error", "JsonRpc Error: Please check input fields and try again ") }
        }
    }

    const handleGetNativeBalance = async () => {
        try {
            loadingInit();
            const bal = await provider.getBalance(walliAddress);
            setNativeBalance(ethers.formatEther(bal.toString()));
            loadingClose("success", "Balance retrieved");
        }
        catch (error: any) {
            const revertData = error?.data;
            loadingClose("error", revertData);
        }
    }

    return (
        <>
            <Card width={"90%"} marginLeft={"5%"} marginTop={"2%"}>
                <Stack direction={"row"} spacing={0}  >
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginLeft={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(0)}> Deposit </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginRight={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(1)}> Balance </Button>
                </Stack>

                {
                    (tabIndex == 0) &&
                    <>
                        <Card width={"50%"} marginTop={10} marginLeft={"25%"} marginBottom={10}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >Deposit Token</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        ERC20
                                    </InputLeftAddon>
                                    <Input type='text' placeholder='0x....' value={depositTokenAddress} onChange={(e) => setDepositTokenAddress(e.target.value)} />
                                </InputGroup>

                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Amount
                                    </InputLeftAddon>
                                    <Input type="number" placeholder='0' value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => handleDepositToken()}>Deposit</Button>
                            </Stack>
                        </Card>
                        <Card width={"50%"} marginTop={2} marginLeft={"25%"} marginBottom={10}>
                            <Box marginLeft={"20%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >Deposit Native Curreny of Chain</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Amount
                                    </InputLeftAddon>
                                    <Input type="number" placeholder='0' value={deposit} onChange={(e) => setDeposit(e.target.value)} />
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => handleDepositNative()}>Deposit</Button>
                            </Stack>
                        </Card>
                    </>
                }
                {
                    (tabIndex == 1) &&
                    <Stack>
                        <Card width={"50%"} marginTop={10} marginLeft={"25%"} marginBottom={5}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5}>Token Balance</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        ERC20
                                    </InputLeftAddon>
                                    <Input type='text' placeholder='0x....' value={balanceTokenAddress} onChange={(e) => setBalanceTokenAddress(e.target.value)} />
                                </InputGroup>

                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Balance
                                    </InputLeftAddon>
                                    <Input readOnly type="number" placeholder='0' value={tokenBalance} />
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => handleGetTokenBalance()}>Get Balance</Button>
                            </Stack>
                        </Card>
                        <Card width={"50%"} marginTop={1} marginLeft={"25%"} marginBottom={10}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5}>Native Balance</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Balance
                                    </InputLeftAddon>
                                    <Input readOnly type="number" placeholder='0' value={nativeBalance} />
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => handleGetNativeBalance()}>Get Balance</Button>
                            </Stack>
                        </Card>
                    </Stack>
                }

            </Card>
        </>


    );
}


export default Tokens;