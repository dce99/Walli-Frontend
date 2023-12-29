import { ethers } from "ethers";
import { WalliPropType } from "../../../types/prop-types";
import { Walli__factory } from "../../../typechain-types";
import { Box, Button, Card, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { NUMBER_OF_BLOCKS_WAIT } from "../../../helpers/const";
import { loadingToast, successToast, errorToast } from "../../../helpers/toasts";


function Lock({ wallet, walli }: WalliPropType) {

    const provider = new ethers.BrowserProvider(window.ethereum);
    const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;
    const [lock, setLock] = useState<Boolean>(false);

    useEffect(() => {
        getLockStatus();
    }, []);


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

    const getLockStatus = async () => {
        const owner = await provider.getSigner();
        const res = await owner.call({
            to: walliAddress,
            data: Walli__factory.createInterface().encodeFunctionData("getLock")
        })
        const _lock = Walli__factory.createInterface().decodeFunctionResult("getLock", res)[0] as number;
        setLock(_lock > 0 ? true : false);
    }

    const handleError = (error: any) => {
        const revertData = error?.data;
        try { const decodedError = Walli__factory.createInterface().parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose("error", "JsonRpc Error: Please check input fields and try again ") }
    }

    const handleLock = async () => {
        try {
            const owner = await provider.getSigner();
            loadingInit();
            const data = (lock) ? Walli__factory.createInterface().encodeFunctionData("unlock") : Walli__factory.createInterface().encodeFunctionData("lock");
            const res = await owner.sendTransaction({
                to: walliAddress,
                data,
            })
            await res.wait(NUMBER_OF_BLOCKS_WAIT);
            loadingClose("success", `Walli has been ${(lock) ? "unlocked" : "locked"}`);
            setLock(!lock);
        }
        catch (error: any) {
            handleError(error);
        }
    }

    return (
        <Card margin={10} width={"50%"} marginLeft={"25%"}>
            <Box textAlign={"center"} margin={10} fontSize={"x-large"}>{lock ? "Unlock" : "Lock"} Smart Wallet</Box>
            <Button size="sm" colorScheme='blue' width={"30%"} marginLeft={"35%"} marginBottom={10} onClick={(e) => handleLock()}>{lock ? "Unlock" : "Lock"}</Button>
        </Card>
    );

}


export default Lock;