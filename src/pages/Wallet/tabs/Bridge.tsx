import { Stack, InputGroup, InputLeftAddon, Input, Box, Card, Button, useToast } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { WalliPropType } from "../../../types/prop-types";
import { ethers, } from "ethers";
import { generateSignature, sendTransaction } from "../../../helpers/sendTransaction";
import { getChainLocalStorageKey } from "../../../helpers/getChainLocalStorageKey";
import { Walli__factory } from "../../../typechain-types";
import { loadingToast, successToast, errorToast } from "../../../helpers/toasts";

// wallet is the signer
// walli is the AA smart account wallet
function Bridge({ wallet, walli }: WalliPropType) {

    const [tokenAddress, setTokenAddress] = useState<string>("");
    const [recepientAddress, setRecepientAddress] = useState<string>("");
    const [amount, setAmount] = useState<number>(0);
    const [destDomain, setDestDomain] = useState<number>(0);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const email = localStorage.getItem(getChainLocalStorageKey(wallet) + "email") ?? "";
    const key = localStorage.getItem(getChainLocalStorageKey(wallet) + "key") ?? "";
    const deviceId = localStorage.getItem(getChainLocalStorageKey(wallet) + "deviceId") ?? "";


    const handleError = (error: any) => {
        const revertData = error?.data;
        try { const decodedError = Walli__factory.createInterface().parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose("error", "JsonRpc Error: Please check input fields and try again ") }
    }

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

    const transaction = async (data: any) => {
        await sendTransaction(data, provider, wallet, walli, handleError);
    }

    const handleBridgeToken = async () => {
        const relayerFee = 100000000000000000n;
        const slippage = 10000;
        const { signatures, messageHash } = (await generateSignature("xTransfer", provider, wallet, walli, email, deviceId))
        const data = Walli__factory.createInterface().encodeFunctionData("xTransfer", [tokenAddress, ethers.parseEther(amount.toString()), recepientAddress, destDomain, slippage, relayerFee, ethers.encodeBytes32String(key), wallet.chainId, messageHash, signatures]);
        await transaction(data);
    }

    return (
        <>
            <Card width={"90%"} marginLeft={"5%"} marginTop={"2%"}>
                {
                    <>
                        <Card width={"50%"} marginTop={5} marginLeft={"25%"} marginBottom={5}>
                            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >Bridge Token</Box>
                            <Stack spacing={5} marginBottom={10}>
                                <InputGroup marginLeft={"5%"} width={"90%"}>
                                    <InputLeftAddon width={"40%"}>
                                        Destination Domain Id
                                    </InputLeftAddon>
                                    <Input type='number' placeholder='0' value={destDomain} onChange={(e) => setDestDomain(e.target.valueAsNumber)} />
                                </InputGroup>
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
                                <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => handleBridgeToken()}>Bridge</Button>
                            </Stack>
                        </Card>
                    </>
                }

            </Card>
        </>


    );
}


export default Bridge;