import { Stack, InputGroup, InputLeftAddon, Input, Box, Card, Button, AvatarGroup, Avatar, Badge, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { WalliPropType } from "../../../types/prop-types";
import { ethers } from "ethers";
import { Walli, Walli__factory } from "../../../typechain-types";
import { NUMBER_OF_BLOCKS_WAIT } from "../../../helpers/const";
import { loadingToast, successToast, errorToast } from "../../../helpers/toasts";

// wallet is the signer
// walli is the AA smart account wallet
function Contacts({ wallet, walli }: WalliPropType) {

    const [newContact, setNewGuardian] = useState<string>("");
    const [newContactName, setNewContactName] = useState<string>("");
    const fakeData = { addr: "0x6B4582B2141570F2B11bf4760994C53ea577d67F", name: "gfgf" } as Walli.ProfileStructOutput;
    const [contacts, setContacts] = useState<Walli.ProfileStruct[]>([]);
    const [start, setStart] = useState<number>(0);
    const [tabIndex, setTabIndex] = useState<number>(0);

    const provider = new ethers.BrowserProvider(window.ethereum);
    const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;

    useEffect(() => {
        updateContactsList();
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
            updateContactsList();
        setTabIndex(index);
    }

    const transaction = async (data: string, handleShow: (start: number) => void) => {
        const owner = await provider.getSigner(wallet.address);
        try {
            loadingInit();
            const response = await owner.sendTransaction({
                to: walliAddress,
                data
            });
            await response.wait(NUMBER_OF_BLOCKS_WAIT);
            loadingClose("success", "Your transaction has been submitted");
            handleShow(start);
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const handleAddNewContact = async () => {
        const data = Walli__factory.createInterface().encodeFunctionData("addTrustedContact", [newContact, ethers.encodeBytes32String(newContactName)]);
        await transaction(data, updateContactsList);
    }

    const handleRemoveContact = async (address: string) => {
        const data = Walli__factory.createInterface().encodeFunctionData("removeTrustedContact", [address]);
        await transaction(data, updateContactsList);
    }

    const updateContactsList = async () => {
        try {
            const data = Walli__factory.createInterface().encodeFunctionData("getTrustedContacts", [start]);
            const owner = await provider.getSigner(wallet.address);
            const response = await owner.call({ to: walliAddress, data });
            const _contacts = Walli__factory.createInterface().decodeFunctionResult("getTrustedContacts", response)[0];
            setContacts(_contacts);
        }
        catch (error: any) {
            handleError(error);
        }
    }

    const handleNext = () => {
        setStart(start + 5);
    }
    const handlePrev = () => {
        setStart((start - 5 >= 0) ? start - 5 : 0);
    }

    const contactsProps = { profiles: contacts, remove: handleRemoveContact, title: "Trusted Contacts" };

    return (
        <>
            <Card width={"90%"} marginLeft={"5%"} marginTop={"2%"}>
                <Stack direction={"row"} spacing={0}  >
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginLeft={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => handleTabClick(0)}> Contacts </Button>
                    <Button colorScheme="blue" rounded='md' marginTop={5} borderWidth={"2px"} marginRight={"10%"} width={"40%"} textAlign={"center"} height={"10"} onClick={() => handleTabClick(3)}> Add </Button>
                </Stack>

                {
                    (tabIndex == 0) &&
                    <>
                        <Stack>
                            <Stack direction={"row"} marginTop={"10"}>
                                <Button size="sm" colorScheme='gray' width={"20%"} marginLeft={"30%"} onClick={(e) => handleNext()}>Next</Button>
                                <Button size="sm" colorScheme='gray' width={"20%"} marginRight={"20%"} onClick={(e) => handlePrev()}>Prev</Button>
                            </Stack>
                            <ListDataCard key={0} {...contactsProps} />
                        </Stack>
                    </>
                }
                {
                    (tabIndex == 3) &&
                    <Card width={"50%"} marginTop={20} marginLeft={"25%"} marginBottom={10}>
                        <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5}>Add Contact</Box>
                        <Stack spacing={5} marginBottom={10}>
                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon width={"18%"}>
                                    Address
                                </InputLeftAddon>
                                <Input type='text' placeholder='0x....' value={newContact} onChange={(e) => setNewGuardian(e.target.value)} />
                            </InputGroup>

                            <InputGroup marginLeft={"5%"} width={"90%"}>
                                <InputLeftAddon width={"18%"}>
                                    Name
                                </InputLeftAddon>
                                <Input type='text' placeholder='Armaan' value={newContactName} onChange={(e) => setNewContactName(e.target.value)} />
                            </InputGroup>
                            <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => handleAddNewContact()}>Add</Button>
                        </Stack>
                    </Card>
                }

            </Card>
        </>


    );
}

export type ListDataCardPropType = {
    profiles: Walli.ProfileStruct[],
    remove: (address: string) => void,
    title: string,
}

function ListDataCard({ profiles, remove, title }: ListDataCardPropType) {

    return (
        <>
            < Card width={"50%"} marginTop={10} marginLeft={"25%"} marginBottom={10} >
                <Box marginLeft={"40%"} fontSize={"x-large"} marginBottom={5} marginTop={5} >{title}</Box>
                {
                    profiles.map((profile: Walli.ProfileStruct, index: number) => {
                        if (profile.addr != "0x0000000000000000000000000000000000000000")
                            return (<Card margin={5} key={index}>
                                < Stack spacing={5} marginBottom={5} direction={"column"}>
                                    <Stack direction={"row"} bg={"whitesmoke"} justifyContent={"space-around"}>
                                        <AvatarGroup spacing='1rem' >
                                            <Avatar bg='gray' />
                                        </AvatarGroup>
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
                                        <Button size="sm" colorScheme='blue' width={"20%"} marginLeft={"40%"} onClick={(e) => remove(profile.addr.toString())}>Remove</Button>
                                    </Box>
                                </Stack>
                            </Card>);
                    })
                }
            </Card >
        </>
    )
}


export default Contacts;