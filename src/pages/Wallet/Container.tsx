import { Box, Button, Flex, Stack, chakra } from "@chakra-ui/react";
import { useState } from "react";
import Tokens from "./tabs/Tokens";
import {  WalliType } from "../../types/prop-types";
import Guardians from "./tabs/Guardians";
import Recovery from "./tabs/Recovery";
import Contacts from "./tabs/Contacts";
import _2FA from "./tabs/2FA";
import Send from "./tabs/Send";
import Bridge from "./tabs/Bridge";
import Lock from "./tabs/Lock"
import { randomString } from "../../helpers/randomString";
import { getChainLocalStorageKey } from "../../helpers/getChainLocalStorageKey";
import CustomWalli from "../../components/customWalliAddress";
import { IWallet } from "../../interface/WalletInterface";

type ContainerType = {
    wallet: IWallet,
    setWalli: (e: WalliType) => void,
    walli: WalliType,
}

function Container({ wallet, walli, setWalli }: ContainerType) {

    const [tabIndex, setTabIndex] = useState<number>(0);
    const tabs = ["Deposit", "Guardians", "Social Recovery", "Trusted Contacts", "2FA", "Send", "Lock", "Bridge"]
    const [closeCustomWalli, setCloseCustomWalli] = useState<boolean>(true);

    let deviceId = localStorage.getItem(getChainLocalStorageKey(wallet) + "deviceId");
    if (!deviceId) {
        deviceId = randomString(12);
        localStorage.setItem(getChainLocalStorageKey(wallet) + "deviceId", deviceId);
    }
    const walliAddress = (wallet.chainId == 5n) ? walli.goerli : walli.mumbai;

    const props = { walli, wallet };
    const components: React.ReactElement[] = [<Tokens {...props} />, <Guardians {...props} />, <Recovery {...props} />, <Contacts {...props} />, <_2FA {...props} />, <Send {...props} />, <Lock {...props} />, <Bridge {...props} />];

    const handleSidebarClick = (index: number) => {
        setTabIndex(index);
    }

    return (
        <>
            <Stack direction="row">
                <Box margin={3} fontSize={"xs"} rounded={"md"} padding={1} border={"2px"} borderColor={"white"} bg={"gray"} color={"white"} fontWeight={"bold"} >
                    Signer: {wallet.address}
                </Box>
                <Box margin={3} fontSize={"xs"} rounded={"md"} padding={1} border={"2px"} borderColor={"white"} bg={"gray"} color={"white"} fontWeight={"bold"} >
                    Smart Wallet: {walliAddress}
                </Box>
                <Box margin={3} fontSize={"xs"} rounded={"md"} padding={1} border={"2px"} borderColor={"white"} bg={"gray"} color={"white"} fontWeight={"bold"} >
                    Chain Id: {wallet.chainId.toString()}
                </Box>
                <Button colorScheme="blue" size={"sm"} margin={"2"} onClick={() => setCloseCustomWalli(false)}>
                    Import Custom Walli Account
                </Button>
                {
                    !closeCustomWalli &&
                    <CustomWalli wallet={wallet} setWalli={setWalli} setCloseCustomWalli={setCloseCustomWalli} />
                }
            </Stack>
            <Flex height={1000}>
                <Box bg="whitesmoke" width="12%" marginRight={"1"} borderRadius={10}>
                    <Flex wrap={"wrap"} top={50} marginTop={"2"} flexDirection={"column"}>
                        <chakra.button
                            px='2.5'
                            py='1.5'
                            bg='lightgray'
                            rounded='md'
                            marginLeft={"10%"}
                            width={"80%"}
                            _hover={{ bg: 'black', textColor: "white" }}
                            left={"2px"}
                            key={0}
                            onClick={() => handleSidebarClick(0)}
                        >
                            Deposit/ Balance
                        </chakra.button>
                        {
                            tabs.map((value, index) => {
                                if (index == 0) return;
                                else
                                    return <chakra.button
                                        px='2.5'
                                        py='1.5'
                                        bg='lightgray'
                                        rounded='md'
                                        _hover={{ bg: 'black', textColor: "white" }}
                                        left={"2px"}
                                        marginLeft={"10%"}
                                        width={"80%"}
                                        marginTop={"7"}
                                        key={index}
                                        onClick={() => handleSidebarClick(index)}
                                    >
                                        {value}
                                    </chakra.button>

                            })
                        }
                    </Flex>
                </Box>
                <Box bg="whitesmoke" width="90%" borderRadius={10}>
                    {
                        <>
                            {components[tabIndex]}
                        </>
                    }
                </Box>
            </Flex>
        </>
    )

}


export default Container;