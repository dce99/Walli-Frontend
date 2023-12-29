import { Stack, InputGroup, InputLeftAddon, Input, Box, Card, Button, AvatarGroup, Avatar, Badge, useToast, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { ListDataCardPropType, ListsType, WalliPropType } from "../../../types/prop-types";
import { ethers } from "ethers";
import { Walli, Walli__factory } from "../../../typechain-types";
import { NUMBER_OF_BLOCKS_WAIT } from "../../../helpers/const";
import { loadingToast, successToast, errorToast } from "../../../helpers/toasts";

// wallet is the signer
// walli is the AA smart account wallet
function Guardians({ wallet, walli }: WalliPropType) {

    const [newGuardian, setNewGuardian] = useState<string>("");
    const [newGuardianName, setNewGuardianName] = useState<string>("");
    const fakeData = [{ addr: "0x6B4582B2141570F2B11bf4760994C53ea577d67F", name: "gfgf" } as Walli.ProfileStructOutput, { addr: "0x0erferferfeferf", name: "gfgf" } as Walli.ProfileStructOutput];
    const [lists, setLists] = useState<ListsType>({
        guardians: [],
        pendingAdditions: [],
        pendingRemovals: [],
    }
    );
    const [tabIndex, setTabIndex] = useState<number>(0);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;

    useEffect(() => {
        updateAllLists();
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

    const handleError = (error: any) => {
        const revertData = error?.data;
        try { const decodedError = Walli__factory.createInterface().parseError(revertData); loadingClose("error", decodedError?.args[0] as string); } catch (e: any) { loadingClose("error", "JsonRpc Error: Please check input fields and try again ") }
    }

    const handleTabClick = (index: number) => {
        if (index == 0)
            updateGuardinsList();
        else if (index == 1)
            updatePendingAdditionsList();
        else if (index == 2)
            updatePendingRemovalsList();
        setTabIndex(index);
    }

    const transaction = async (data: string, handleShow: () => void) => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const response = await owner.sendTransaction({
                to: walliAddress,
                data
            });
            await response.wait(NUMBER_OF_BLOCKS_WAIT);
            loadingClose("success", "Your transaction has been submitted");
            handleShow();
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const handleAddNewGuardian = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("initiateGuardianAddition", [newGuardian, ethers.encodeBytes32String(newGuardianName)]);
        await transaction(data, updatePendingAdditionsList);
    }

    const handleFinaliseAddition = async (address: string) => {
        const data = Walli__factory.createInterface().encodeFunctionData("finaliseGuardianAddition", [address]);
        await transaction(data, updatePendingAdditionsList);
    }

    const handleCancelAddition = async (address: string) => {
        const data = Walli__factory.createInterface().encodeFunctionData("cancelGuardianAddition", [address]);
        await transaction(data, updatePendingAdditionsList);
    }

    const handleRemoveGuardian = async (address: string, name: string) => {
        const data = Walli__factory.createInterface().encodeFunctionData("initiateGuardianRemoval", [address, name]);
        await transaction(data, updatePendingRemovalsList);
    }

    const handleFinaliseRemoval = async (address: string) => {
        const data = Walli__factory.createInterface().encodeFunctionData("finaliseGuardianRemoval", [address]);
        await transaction(data, updatePendingRemovalsList);
    }

    const handleCancelRemoval = async (address: string) => {
        const data = Walli__factory.createInterface().encodeFunctionData("cancelGuardianRemoval", [address]);
        await transaction(data, updatePendingRemovalsList);
    }

    const getCallData = (tabIndex: number) => {
        switch (tabIndex) {
            case 0:
                return Walli__factory.createInterface().encodeFunctionData("getGuardians");
            case 1:
                return Walli__factory.createInterface().encodeFunctionData("getPendingGuardianAdditions");
            case 2:
                return Walli__factory.createInterface().encodeFunctionData("getPendingGuardianRemovals");
        }
    }
    const getCallResult = (tabIndex: number, response: any) => {
        switch (tabIndex) {
            case 0:
                return Walli__factory.createInterface().decodeFunctionResult("getGuardians", response)[0];
            case 1:
                return Walli__factory.createInterface().decodeFunctionResult("getPendingGuardianAdditions", response)[0];
            case 2:
                return Walli__factory.createInterface().decodeFunctionResult("getPendingGuardianRemovals", response)[0];
        }
    }

    const call = async (tabIndex: number) => {
        const data = getCallData(tabIndex);
        const owner = await provider.getSigner(wallet.address);
        const response = await owner.call({ to: walliAddress, data });
        return getCallResult(tabIndex, response);
    }

    const updateAllLists = async () => {
        try {
            const guardians = await call(0);
            const pendingAdditions = await call(1);
            const pendingRemovals = await call(2);
            setLists({ guardians, pendingAdditions, pendingRemovals });
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const updateGuardinsList = async () => {
        try {
            const guardians = await call(0);
            setLists({ ...lists, guardians });
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const updatePendingAdditionsList = async () => {
        try {
            const pendingAdditions = await call(1);
            setLists({ ...lists, pendingAdditions });
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const updatePendingRemovalsList = async () => {
        try {
            const pendingRemovals = await call(2);
            setLists({ ...lists, pendingRemovals });
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const func = async (address: string) => { };

    const guardiansProps = { profiles: lists.guardians, cancel: func, confirm: func, remove: handleRemoveGuardian, pending: false, title: "Guardians" };
    const pendingAdditionProps = { profiles: lists.pendingAdditions, cancel: handleCancelAddition, confirm: handleFinaliseAddition, remove: func, pending: true, title: "Pending Additions(Security Period 2 Minutes)" };
    const pendingRemovalProps = { profiles: lists.pendingRemovals, cancel: handleCancelRemoval, confirm: handleFinaliseRemoval, remove: func, pending: true, title: "Pending Removals(Security Period 2 Minutes)" };

    return (
        <>
            <Card width={"90%"} marginLeft={"5%"} marginTop={"2%"}>
                <Stack direction={"row"} spacing={0}  >
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginLeft={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => handleTabClick(0)}> List </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => handleTabClick(1)}> Pending Additions </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => handleTabClick(2)}> Pending Removals </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginRight={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => handleTabClick(3)}> Add </Button>
                </Stack>

                {
                    (tabIndex == 0) &&
                    <ListDataCard key={0} {...guardiansProps} />
                }
                {
                    tabIndex == 1 &&
                    <ListDataCard key={1} {...pendingAdditionProps} />
                }
                {
                    tabIndex == 2 &&
                    <ListDataCard key={2} {...pendingRemovalProps} />
                }
                {
                    (tabIndex == 3) &&
                    <Card width={"50%"} marginTop={20} marginLeft={"25%"} marginBottom={10}>
                        <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5}>Add Guardian</Box>
                        <Stack spacing={5} marginBottom={10}>
                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon width={"18%"}>
                                    Address
                                </InputLeftAddon>
                                <Input type='text' placeholder='0x....' value={newGuardian} onChange={(e) => setNewGuardian(e.target.value)} />
                            </InputGroup>

                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon width={"18%"}>
                                    Name
                                </InputLeftAddon>
                                <Input type='text' placeholder='Armaan' value={newGuardianName} onChange={(e) => setNewGuardianName(e.target.value)} />
                            </InputGroup>
                            <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => handleAddNewGuardian()}>Add</Button>
                        </Stack>
                    </Card>
                }

            </Card>
        </>


    );
}

function ListDataCard({ profiles, remove, cancel, confirm, pending, title }: ListDataCardPropType) {

    return (
        <Card width={"50%"} marginTop={10} marginLeft={"25%"} marginBottom={10}>
            <Box marginLeft={"10%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >{title}</Box>
            {
                profiles.map((profileObj: Walli.ProfileStruct | Walli.RequestConfigStruct, index: number) => {

                    const profile = {
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        addr: (profileObj.addr) ? profileObj.addr : profileObj.profile.addr,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        name: (profileObj.name) ? profileObj.name : profileObj.profile.name,
                    }

                    if (profile.addr != "0x0000000000000000000000000000000000000000")
                        return (
                            <Card margin={5} key={index}>
                                < Stack spacing={5} marginBottom={5} direction={"column"}>
                                    <Stack direction={"row"} bg={"whitesmoke"} justifyContent={"space-between"}>
                                        <AvatarGroup spacing='1rem' >
                                            <Avatar bg='gray' />
                                        </AvatarGroup>
                                        <Badge variant='solid' colorScheme={pending ? "yellow" : "purple"} margin={5} fontSize={"xs"} padding={0.5} >
                                            {pending ? "Pending" : "Active"}
                                        </Badge>
                                    </Stack>
                                    <Box>
                                        <Box margin={5}>
                                            <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                                Address
                                            </Badge>
                                            <Box>{profile.addr.toString()}</Box>
                                        </Box>
                                        <Box margin={5}>
                                            <Badge variant='solid' colorScheme='gray' margin={1} fontSize={"sm"}>
                                                Name
                                            </Badge>
                                            <Box>{ethers.decodeBytes32String(profile.name)}</Box>
                                        </Box>
                                        {
                                            !pending &&
                                            <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => remove(profile.addr.toString(), profile.name.toString())}>Remove</Button>
                                        }
                                        {
                                            pending &&
                                            <>
                                                <Stack direction={"row"} justifyContent={"space-evenly"}>
                                                    <Button size="sm" colorScheme='blue' width={"20%"} onClick={(e) => confirm(profile.addr.toString())}>Confirm</Button>
                                                    <Button size="sm" colorScheme='blue' width={"20%"} onClick={(e) => cancel(profile.addr.toString())}>Cancel</Button>
                                                </Stack>
                                            </>
                                        }
                                    </Box>
                                </Stack>
                            </Card>
                        )
                })

            }
        </Card>
    )
}


export default Guardians;