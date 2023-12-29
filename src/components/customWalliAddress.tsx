import { Box, Button, Input, InputGroup, InputLeftAddon, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { WalliType } from "../types/prop-types";
import { IWallet } from "../interface/WalletInterface";
import { ethers } from "ethers";
import { Walli__factory } from "../typechain-types";
import { infoToast, loadingToast, successToast, errorToast } from "../helpers/toasts";
import { getChainLocalStorageKey } from "../helpers/getChainLocalStorageKey";

type CustomWalliType = {
    setWalli: (e: WalliType) => void,
    wallet: IWallet,
    setCloseCustomWalli: (e: boolean) => void,
}
function CustomWalli({ setWalli, wallet,setCloseCustomWalli }: CustomWalliType) {

    const [customAddress, setCustomAddress] = useState<string>("");
    const { isOpen, onOpen, onClose } = useDisclosure()

    useEffect(() => {
        onOpen();
    }, [])

    const onModalClose = () => {
        setCloseCustomWalli(true);
        onClose();
    }

    const handleError = (error: any) => {
        loadingClose("error", "Invalid address or you are not owner of the given custom Walli address");
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

    const handleCustomWalli = async ()=>{
        try {
            
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner(wallet.address);
            const res = await signer.call({
                to: customAddress,
                data: Walli__factory.createInterface().encodeFunctionData("owner")
            });
            const owner = Walli__factory.createInterface().decodeFunctionResult("owner", res)[0];
            if(owner != signer.address)
                throw new Error("Invalid address or you are not owner of the given custom Walli address");
                
            if (wallet.chainId == 5n)
                setWalli({ set: true, goerli: customAddress, mumbai: "" });
            else
                setWalli({ set: true, goerli: "", mumbai: customAddress });
            localStorage.setItem(getChainLocalStorageKey(wallet) + "proxy", customAddress);
            onModalClose();
        }
        catch(error:any){
            handleError(error);
        }
    }

    return (
        <Modal isCentered isOpen={isOpen} onClose={onModalClose}>
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px)' />
            <ModalContent>
                <ModalHeader color={"white"} bg="gray">Use Custom Walli Address</ModalHeader>
                <ModalCloseButton bg="white" _hover={{ color: "blue", borderColor: "blue" }} />
                <ModalBody>
                    <InputGroup marginLeft={"5%"} width={"90%"}>
                        <InputLeftAddon width={"35%"}>
                            Walli Address
                        </InputLeftAddon>
                        <Input type='text' placeholder='0x....' value={customAddress} onChange={(e) => setCustomAddress(e.target.value)} />
                    </InputGroup>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={handleCustomWalli}>Import</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

export default CustomWalli;