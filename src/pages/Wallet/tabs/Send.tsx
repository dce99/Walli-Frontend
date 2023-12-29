import { Stack, InputGroup, InputLeftAddon, Input, Box, Card, Button, useToast } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { WalliPropType } from "../../../types/prop-types";
import { ethers } from "ethers";
import { generateSignature, sendTransaction } from "../../../helpers/sendTransaction";
import { getChainLocalStorageKey } from "../../../helpers/getChainLocalStorageKey";
import { Walli__factory } from "../../../typechain-types";
import { loadingToast, successToast, errorToast } from "../../../helpers/toasts";
import { NUMBER_OF_BLOCKS_WAIT } from "../../../helpers/const";

// wallet is the signer
// walli is the AA smart account wallet
function Send({ wallet, walli }: WalliPropType) {

    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [recepientAddress, setRecepientAddress] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [limit, setLimit] = useState<number>(0);
    const [getLimit, setGetLimit] = useState<string>("0");
    const [tabIndex, setTabIndex] = useState<number>(0);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;
    const email = localStorage.getItem(getChainLocalStorageKey(wallet) + "email") ?? "";
    const key = localStorage.getItem(getChainLocalStorageKey(wallet) + "key") ?? "";
    const deviceId = localStorage.getItem(getChainLocalStorageKey(wallet) + "deviceId") ?? "";

    const toast = useToast();
    const toastRef = useRef();
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

    const handleError = (error: any) => {
        const revertData = error?.data;
        try { const decodedError = Walli__factory.createInterface().parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose("error", "JsonRpc Error: Please check input fields and try again ") }
    }

    const transaction = async (data: any) => {
        loadingInit();
        const result = await sendTransaction(data, provider, wallet, walli, handleError);
        if (result)
            loadingClose("success", "Transaction has been submitted");
    }

    const directTransaction = async (data: any) => {
        try {
            const owner = await provider.getSigner(wallet.address);
            loadingInit();
            const res = await owner.sendTransaction({
                to: walliAddress,
                data
            });
            await res.wait(NUMBER_OF_BLOCKS_WAIT);
            loadingClose("success", "Transaction has been submitted");
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const handleSendToken = async () => {
        const { signatures, messageHash } = (await generateSignature("sendToken", provider, wallet, walli, email, deviceId))
        const data = Walli__factory.createInterface().encodeFunctionData("sendToken", [tokenAddress, recepientAddress, ethers.parseEther(amount.toString()), ethers.encodeBytes32String(key), wallet.chainId, messageHash, signatures]);
        await transaction(data);
    }
    const handleSendNative = async () => {
        const { signatures, messageHash } = (await generateSignature("sendNative", provider, wallet, walli, email, deviceId))
        const data = Walli__factory.createInterface().encodeFunctionData("sendNative", [recepientAddress, ethers.parseEther(amount.toString()), ethers.encodeBytes32String(key), wallet.chainId, messageHash, signatures]);
        await transaction(data);
    }

    const handleSetTokenLimit = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("setTokenLimit", [tokenAddress, ethers.parseEther(limit.toString())]);
        await directTransaction(data);
    }
    const handleSetNativeLimit = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("setNativeLimit", [ethers.parseEther(limit.toString())]);
        await directTransaction(data);
    }

    const handleGetTokenLimit = async () => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const response = await owner.call({
                to: walliAddress,
                data: Walli__factory.createInterface().encodeFunctionData("getTokenLimit", [tokenAddress])
            });
            const _limit = Walli__factory.createInterface().decodeFunctionResult("getTokenLimit", response)[0];
            loadingClose("success", "Token limit retreived")
            setGetLimit(ethers.formatEther(_limit.toString()));
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const handleGetNativeLimit = async () => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const response = await owner.call({
                to: walliAddress,
                data: Walli__factory.createInterface().encodeFunctionData("getNativeLimit")
            });
            const _limit = Walli__factory.createInterface().decodeFunctionResult("getNativeLimit", response)[0];
            loadingClose("success", "Native Token limit retreived");
            setGetLimit(ethers.formatEther(_limit.toString()));
        }
        catch (error: any) {
            handleError(error);
        }
    }

    return (
        <>
            <Card width={"90%"} marginLeft={"5%"} marginTop={"2%"}>
                <Stack direction={"row"} spacing={0}  >
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginLeft={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(0)}> Transfer </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(1)}> Set Transfer Limits </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginRight={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(2)}> Get Transfer Limits </Button>
                </Stack>

                {
                    (tabIndex == 0) &&
                    <>
                        <Card width={"50%"} marginTop={5} marginLeft={"25%"} marginBottom={5}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >Send Token</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Recepient
                                    </InputLeftAddon>
                                    <Input type='text' placeholder='0x....' value={recepientAddress} onChange={(e) => setRecepientAddress(e.target.value)} />
                                </InputGroup>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        ERC20
                                    </InputLeftAddon>
                                    <Input type='text' placeholder='0x....' value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
                                </InputGroup>

                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Amount
                                    </InputLeftAddon>
                                    <Input type="number" placeholder='0' value={amount} onChange={(e) => setAmount(e.target.valueAsNumber)} />
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => handleSendToken()}>Send</Button>
                            </Stack>
                        </Card>
                        <Card width={"50%"} marginTop={2} marginLeft={"25%"} marginBottom={10}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >Send Native</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Recepient
                                    </InputLeftAddon>
                                    <Input type='text' placeholder='0x....' value={recepientAddress} onChange={(e) => setRecepientAddress(e.target.value)} />
                                </InputGroup>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Amount
                                    </InputLeftAddon>
                                    <Input type="number" placeholder='0' value={amount} onChange={(e) => setAmount(e.target.valueAsNumber)} />
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => handleSendNative()}>Send</Button>
                            </Stack>
                        </Card>
                    </>
                }
                {
                    (tabIndex == 1) &&
                    <>
                        <Card width={"50%"} marginTop={5} marginLeft={"25%"} marginBottom={5}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5}>Token Limit</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        ERC20
                                    </InputLeftAddon>
                                    <Input type='text' placeholder='0x....' value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
                                </InputGroup>

                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Limit
                                    </InputLeftAddon>
                                    {<Input type="number" placeholder='0' value={limit} onChange={(e) => setLimit(e.target.valueAsNumber)} />}
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => handleSetTokenLimit()}>Set Limit</Button>
                            </Stack>
                        </Card>
                        <Card width={"50%"} marginTop={2} marginLeft={"25%"} marginBottom={10}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5}>Native Limit</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Limit
                                    </InputLeftAddon>
                                    {<Input type="number" placeholder='0' value={limit} onChange={(e) => setLimit(e.target.valueAsNumber)} />}
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => handleSetNativeLimit()}>Set Limit</Button>
                            </Stack>
                        </Card>
                    </>
                }
                {
                    (tabIndex == 2) &&
                    <Stack>
                        <Card width={"50%"} marginTop={10} marginLeft={"25%"} marginBottom={5}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5}>Get Transfer Limits</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        ERC20
                                    </InputLeftAddon>
                                    <Input type='text' placeholder='0x....' value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} />
                                </InputGroup>

                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Limit
                                    </InputLeftAddon>
                                    <Input readOnly type="number" placeholder='0' value={getLimit} />
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => handleGetTokenLimit()}>Get Limit</Button>
                            </Stack>
                        </Card>
                        <Card width={"50%"} marginTop={1} marginLeft={"25%"} marginBottom={10}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5}>Native Limit</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"20%"}>
                                        Limit
                                    </InputLeftAddon>
                                    <Input readOnly type="number" placeholder='0' value={getLimit} />
                                </InputGroup>
                                <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => handleGetNativeLimit()}>Get Limit</Button>
                            </Stack>
                        </Card>
                    </Stack>
                }

            </Card>
        </>


    );
}


export default Send;