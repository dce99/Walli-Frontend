import { Card, Stack, Button, InputGroup, InputLeftAddon, Input, Box, Badge, useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useRef, useState } from "react";
import { Walli__factory } from "../../../typechain-types";
import { ListDataType, WalliPropType } from "../../../types/prop-types";
import { NUMBER_OF_BLOCKS_WAIT } from "../../../helpers/const";
import { loadingToast, successToast, errorToast } from "../../../helpers/toasts";


function Recovery({ wallet, walli }: WalliPropType) {

    const [newOwner, setNewOwner] = useState<string>("");
    const [recoveryAddress, setRecoveryAddress] = useState<string>("");
    const [recoveryInfo, setRecoveryInfo] = useState({ newOwner: "", finaliseAfter: "", guardianCount: 0n, confirmedCount: 0n, cancelledCount: 0n })
    const [tabIndex, setTabIndex] = useState<number>(0);

    const provider = new ethers.BrowserProvider(window.ethereum);

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

    const transaction = async (data: string) => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const response = await owner.sendTransaction({
                to: recoveryAddress,
                data
            });
            await response.wait(NUMBER_OF_BLOCKS_WAIT);
            loadingClose("success", "Your transaction has been submitted");
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const initiateRecovery = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("initiateRecovery", [newOwner]);
        await transaction(data);
    }
    const confirmRecovery = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("confirmRecovery");
        await transaction(data);
    }
    const cancelRecovery = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("cancelRecovery");
        await transaction(data);
    }
    const finaliseRecovery = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("finaliseRecovery");
        await transaction(data);
    }

    const getRecovery = async () => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const response = await owner.call({
                to: recoveryAddress,
                data: Walli__factory.createInterface().encodeFunctionData("getRecovery")
            });
            const data = Walli__factory.createInterface().decodeFunctionResult("getRecovery", response)
            loadingClose("success", "Recovery information retreived");
            setRecoveryInfo({ newOwner: data[0], finaliseAfter: "", guardianCount: data[2], confirmedCount: data[3], cancelledCount: data[4] })
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const initiateProps = { recoveryAddress, newOwner, setRecoveryAddress, setNewOwner, initiateRecovery, confirmRecovery, cancelRecovery, finaliseRecovery, requestType: "Initiate" }
    const confirmProps = { recoveryAddress, newOwner, setRecoveryAddress, setNewOwner, initiateRecovery, confirmRecovery, cancelRecovery, finaliseRecovery, requestType: "Confirm" }
    const cancelProps = { recoveryAddress, newOwner, setRecoveryAddress, setNewOwner, initiateRecovery, confirmRecovery, cancelRecovery, finaliseRecovery, requestType: "Cancel" }
    const finaliseProps = { recoveryAddress, newOwner, setRecoveryAddress, setNewOwner, initiateRecovery, confirmRecovery, cancelRecovery, finaliseRecovery, requestType: "Finalise" }

    return (
        <>
            <Card width={"90%"} marginLeft={"5%"} marginTop={"2%"}>
                <Stack direction={"row"} spacing={0}  >
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginLeft={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(0)}> Initiate </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(1)}> Confirm </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(2)}> Cancel </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(3)}> Finalise </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginRight={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => setTabIndex(4)}> Info </Button>
                </Stack>

                {
                    (tabIndex == 0) &&
                    <ListData {...initiateProps} />
                }
                {
                    (tabIndex == 1) &&
                    <ListData {...confirmProps} />
                }
                {
                    (tabIndex == 2) &&
                    <ListData {...cancelProps} />
                }
                {
                    (tabIndex == 3) &&
                    <ListData {...finaliseProps} />
                }
                {
                    (tabIndex == 4) &&
                    <Card width={"50%"} marginTop={20} marginLeft={"25%"} marginBottom={10}>
                        <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >Recovery Info</Box>
                        <Stack spacing={5} marginBottom={10}>
                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon >
                                    Recovery Wallet Address
                                </InputLeftAddon>
                                <Input type='text' placeholder='0x....' value={recoveryAddress} onChange={(e) => setRecoveryAddress(e.target.value)} />
                            </InputGroup>
                            <Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        New Owner
                                    </Badge>
                                    <Box>{recoveryInfo.newOwner}</Box>
                                </Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        Finalise After(Recovery Period)
                                    </Badge>
                                    <Box>{recoveryInfo.finaliseAfter}</Box>
                                </Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        Guardians Count(Current)
                                    </Badge>
                                    <Box>{recoveryInfo.guardianCount.toString()}</Box>
                                </Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        Confirmed Count(Guardians)
                                    </Badge>
                                    <Box>{recoveryInfo.confirmedCount.toString()}</Box>
                                </Box>
                                <Box margin={5}>
                                    <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                        Cancelled Count(Guardians)
                                    </Badge>
                                    <Box>{recoveryInfo.cancelledCount.toString()}</Box>
                                </Box>
                            </Box>
                            <Button size="sm" colorScheme='blue' width={"30%"} marginLeft={"35%"} onClick={(e) => getRecovery()}>Get Recovery Info</Button>
                        </Stack>
                    </Card>

                }

            </Card>
        </>


    );
}

function ListData({ recoveryAddress, newOwner, setRecoveryAddress, setNewOwner, initiateRecovery, confirmRecovery, cancelRecovery, finaliseRecovery, requestType }: ListDataType) {
    return (
        <Card width={"50%"} marginTop={20} marginLeft={"25%"} marginBottom={10}>
            <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >{requestType} Recovery</Box>
            <Stack spacing={5} marginBottom={10}>
                <InputGroup marginLeft={"5%"} width={"90%"}>
                    <InputLeftAddon>
                        Recovery Wallet Address
                    </InputLeftAddon>
                    <Input type='text' placeholder='0x....' value={recoveryAddress} onChange={(e) => setRecoveryAddress(e.target.value)} />
                </InputGroup>
                {
                    requestType == "Initiate" &&
                    <InputGroup marginLeft={"5%"} width={"90%"}>
                        <InputLeftAddon>
                            New Owner Address
                        </InputLeftAddon>
                        <Input type='text' placeholder='0x....' value={newOwner} onChange={(e) => setNewOwner(e.target.value)} />
                    </InputGroup>
                }
                {
                    requestType == "Initiate" &&
                    <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => initiateRecovery()}>Initiate</Button>
                }
                {
                    requestType == "Confirm" &&
                    <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => confirmRecovery()}>Confirm</Button>
                }
                {
                    requestType == "Cancel" &&
                    <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => cancelRecovery()}>Cancel</Button>
                }
                {
                    requestType == "Finalise" &&
                    <Button size="sm" colorScheme='blue' width={"15%"} marginLeft={"45%"} onClick={(e) => finaliseRecovery()}>Finalise</Button>
                }
            </Stack>
        </Card>
    );
}


export default Recovery;